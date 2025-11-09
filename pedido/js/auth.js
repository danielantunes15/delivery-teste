// js/auth.js - Módulo de Autenticação (Corrigido com verificações)

(function() {

    /**
     * Inicia a sessão do usuário (login ou cadastro)
     */
    async function iniciarSessao() {
        const elementos = window.AppUI.elementos;
        
        // Verificar se os elementos existem
        if (!elementos.authTelefone) {
            console.error('Elemento authTelefone não encontrado');
            window.AppUI.mostrarMensagem('Erro no sistema. Recarregue a página.', 'error');
            return;
        }
        
        const telefoneInput = elementos.authTelefone;
        const telefone = telefoneInput.value.replace(/\D/g, '');

        // Validação básica
        if (telefone.length < 10) {
            window.AppUI.mostrarMensagem('Por favor, digite um telefone válido com DDD.', 'error');
            telefoneInput.focus();
            return;
        }

        try {
            window.AppUI.mostrarMensagem('Verificando seu número...', 'info');
            
            // Buscar cliente no banco
            const cliente = await window.AppAPI.buscarClientePorTelefone(telefone);
            
            if (cliente) {
                // Cliente existe - fazer login
                await fazerLogin(cliente);
            } else {
                // Cliente não existe - mostrar formulário de cadastro
                mostrarFormularioCadastro(telefone);
            }
            
        } catch (error) {
            console.error('Erro ao iniciar sessão:', error);
            window.AppUI.mostrarMensagem('Erro ao verificar cadastro. Tente novamente.', 'error');
        }
    }

    /**
     * Realiza o login do cliente
     */
    async function fazerLogin(cliente) {
        try {
            window.app.clientePerfil = cliente;
            window.app.clienteLogado = true;
            
            // Salvar no localStorage
            localStorage.setItem('clientePerfil', JSON.stringify(cliente));
            
            window.AppUI.mostrarMensagem(`Bem-vindo(a) de volta, ${cliente.nome}!`, 'success');
            
            // Atualizar UI
            window.app.atualizarUIposLogin();
            
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }

    /**
     * Mostra o formulário de cadastro
     */
    function mostrarFormularioCadastro(telefone) {
        const elementos = window.AppUI.elementos;
        
        // Verificar elementos necessários
        if (!elementos.loginFormGroup || !elementos.cadastroForm || !elementos.cadastroTelefoneHidden) {
            console.error('Elementos do formulário de cadastro não encontrados');
            return;
        }
        
        // Esconder formulário de login
        elementos.loginFormGroup.style.display = 'none';
        
        // Mostrar formulário de cadastro
        elementos.cadastroForm.style.display = 'block';
        elementos.cadastroTelefoneHidden.value = telefone;
        
        window.AppUI.mostrarMensagem('Número não cadastrado. Complete seu cadastro!', 'info');
    }

    /**
     * Finaliza o cadastro do cliente
     */
    async function finalizarCadastro(event) {
        event.preventDefault();
        
        const elementos = window.AppUI.elementos;
        
        // Verificar se o botão existe
        if (!elementos.btnFinalizarCadastro) {
            console.error('Botão finalizar cadastro não encontrado');
            return;
        }
        
        const btnFinalizar = elementos.btnFinalizarCadastro;
        
        // Validar campos obrigatórios
        const camposObrigatorios = [
            { campo: elementos.cadastroNome, nome: 'Nome' },
            { campo: elementos.cadastroCep, nome: 'CEP' },
            { campo: elementos.cadastroRuaInput, nome: 'Rua' },
            { campo: elementos.cadastroNumeroInput, nome: 'Número' },
            { campo: elementos.cadastroBairroInput, nome: 'Bairro' },
            { campo: elementos.cadastroCidadeInput, nome: 'Cidade' },
            { campo: elementos.cadastroEstadoInput, nome: 'Estado' }
        ];
        
        for (let { campo, nome } of camposObrigatorios) {
            if (!campo || !campo.value.trim()) {
                window.AppUI.mostrarMensagem(`Preencha o campo: ${nome}`, 'error');
                if (campo) campo.focus();
                return;
            }
        }
        
        try {
            // Desabilitar botão durante o cadastro
            btnFinalizar.disabled = true;
            btnFinalizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
            
            const telefone = elementos.cadastroTelefoneHidden ? elementos.cadastroTelefoneHidden.value : '';
            const enderecoCompleto = `${elementos.cadastroRuaInput.value}, ${elementos.cadastroNumeroInput.value} - ${elementos.cadastroBairroInput.value}, ${elementos.cadastroCidadeInput.value} - ${elementos.cadastroEstadoInput.value}`;
            
            const dadosCliente = {
                telefone: telefone,
                nome: elementos.cadastroNome.value.trim(),
                endereco: enderecoCompleto,
                created_at: new Date().toISOString()
            };
            
            // Salvar no Supabase
            const novoCliente = await window.AppAPI.finalizarCadastroNoSupabase(dadosCliente);
            
            // Fazer login automaticamente
            await fazerLogin(novoCliente);
            
            window.AppUI.mostrarMensagem('Cadastro realizado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro no cadastro:', error);
            
            if (error.message.includes('já está cadastrado')) {
                window.AppUI.mostrarMensagem(error.message, 'warning');
                // Voltar para o login
                if (elementos.cadastroForm && elementos.loginFormGroup) {
                    elementos.cadastroForm.style.display = 'none';
                    elementos.loginFormGroup.style.display = 'block';
                }
            } else {
                window.AppUI.mostrarMensagem('Erro ao realizar cadastro. Tente novamente.', 'error');
            }
            
        } finally {
            // Reabilitar botão
            if (btnFinalizar) {
                btnFinalizar.disabled = false;
                btnFinalizar.textContent = 'Finalizar Cadastro';
            }
        }
    }

    /**
     * Salva a edição do endereço
     */
    async function salvarEdicaoEndereco(event) {
        event.preventDefault();
        
        const elementos = window.AppUI.elementos;
        
        // Verificar se o formulário existe
        if (!elementos.formEditarEndereco) {
            console.error('Formulário de edição de endereço não encontrado');
            return;
        }
        
        const btnSalvar = elementos.formEditarEndereco.querySelector('button[type="submit"]');
        
        // Validar campos
        const camposEndereco = [
            { campo: elementos.modalRuaInput, nome: 'Rua' },
            { campo: elementos.modalNumeroInput, nome: 'Número' },
            { campo: elementos.modalBairroInput, nome: 'Bairro' },
            { campo: elementos.modalCidade, nome: 'Cidade' },
            { campo: elementos.modalEstado, nome: 'Estado' }
        ];
        
        for (let { campo, nome } of camposEndereco) {
            if (!campo || !campo.value.trim()) {
                window.AppUI.mostrarMensagem(`Preencha o campo: ${nome}`, 'error');
                if (campo) campo.focus();
                return;
            }
        }
        
        try {
            // Desabilitar botão
            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            }
            
            const enderecoCompleto = `${elementos.modalRuaInput.value}, ${elementos.modalNumeroInput.value} - ${elementos.modalBairroInput.value}, ${elementos.modalCidade.value} - ${elementos.modalEstado.value}`;
            
            // Atualizar no Supabase
            await window.AppAPI.salvarEdicaoEnderecoNoSupabase(
                window.app.clientePerfil.telefone, 
                enderecoCompleto
            );
            
            // Atualizar localmente
            window.app.clientePerfil.endereco = enderecoCompleto;
            localStorage.setItem('clientePerfil', JSON.stringify(window.app.clientePerfil));
            
            // Atualizar UI
            window.app.atualizarUIposLogin();
            
            // Fechar modal
            if (elementos.modalEditarEndereco) {
                window.AppUI.fecharModal(elementos.modalEditarEndereco);
            }
            
            window.AppUI.mostrarMensagem('Endereço atualizado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao salvar endereço:', error);
            window.AppUI.mostrarMensagem('Erro ao atualizar endereço. Tente novamente.', 'error');
            
        } finally {
            // Reabilitar botão
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.textContent = 'Salvar Novo Endereço';
            }
        }
    }

    /**
     * Realiza logout do usuário
     */
    function fazerLogout() {
        if (confirm('Tem certeza que deseja sair?')) {
            // Limpar dados locais
            window.app.clienteLogado = false;
            window.app.clientePerfil = null;
            window.app.carrinhoItens = [];
            window.app.pedidoAtivoId = null;
            
            // Parar rastreamento
            if (window.AppRastreamento) {
                window.AppRastreamento.pararRastreamento();
            }
            
            // Limpar localStorage
            localStorage.removeItem('clientePerfil');
            localStorage.removeItem('pedidoAtivoId');
            localStorage.removeItem('carrinhoItens');
            
            // Resetar UI
            if (window.app.elementos.cadastroForm) {
                window.app.elementos.cadastroForm.style.display = 'none';
            }
            if (window.app.elementos.loginFormGroup) {
                window.app.elementos.loginFormGroup.style.display = 'block';
            }
            if (window.app.elementos.authTelefone) {
                window.app.elementos.authTelefone.value = '';
            }
            
            // Esconder navegação mobile
            if (window.app.elementos.mobileBottomNav) {
                window.app.elementos.mobileBottomNav.style.display = 'none';
            }
            
            // Mostrar tela de auth
            window.app.mostrarView('auth-screen');
            
            window.AppUI.mostrarMensagem('Logout realizado com sucesso!', 'success');
        }
    }

    // Expõe as funções para o objeto global AppAuth
    window.AppAuth = {
        iniciarSessao,
        fazerLogin,
        finalizarCadastro,
        salvarEdicaoEndereco,
        fazerLogout
    };

})();