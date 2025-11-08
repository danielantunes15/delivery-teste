// js/auth.js - Módulo de Autenticação do Cliente

(function() {
    
    const ui = window.AppUI;
    const api = window.AppAPI;
    const app = window.app; // Acesso ao estado global

    /**
     * Verifica se há um cliente salvo no localStorage ao carregar a página.
     */
    async function verificarSessaoLocal() {
        const telefoneSalvo = localStorage.getItem('clienteTelefone');
        if (telefoneSalvo) {
            const cliente = await api.buscarClientePorTelefone(telefoneSalvo);
            if (cliente) {
                app.clientePerfil = cliente;
                app.clienteLogado = { id: cliente.telefone, email: cliente.telefone };
            } else {
                 // Limpa dados inválidos
                 localStorage.removeItem('clienteTelefone');
                 localStorage.removeItem('pedidoAtivoId');
            }
        }
    }

    /**
     * Tenta logar ou iniciar o cadastro com um número de telefone.
     */
    async function iniciarSessao(e) {
        e.preventDefault();
        const telefoneRaw = ui.elementos.authTelefoneInput.value.trim();
        const telefone = ui.formatarTelefone(telefoneRaw); // Usa a função de UI

        if (telefone.length < 10) { 
            return ui.mostrarMensagem('Por favor, insira um telefone válido com DDD.', 'error');
        }

        ui.elementos.btnIniciarSessao.disabled = true;
        ui.elementos.btnIniciarSessao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

        const cliente = await api.buscarClientePorTelefone(telefone);

        if (cliente) {
            app.clientePerfil = cliente;
            ui.mostrarMensagem(`Bem-vindo de volta, ${cliente.nome.split(' ')[0]}!`, 'success');
            logarClienteManual(true); // true = mostrar mensagem
        } else {
            ui.elementos.cadastroTelefoneHidden.value = telefone;
            ui.elementos.loginFormGroup.style.display = 'none';
            ui.elementos.cadastroForm.style.display = 'block';
            ui.mostrarMensagem('Novo cliente detectado! Complete seu cadastro.', 'info');
        }

        ui.elementos.btnIniciarSessao.disabled = false;
        ui.elementos.btnIniciarSessao.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar ou Cadastrar';
    }

    /**
     * Finaliza o cadastro de um novo cliente.
     */
    async function finalizarCadastro(e) {
        e.preventDefault();
        const nome = ui.elementos.cadastroNomeInput.value.trim();
        const telefone = ui.elementos.cadastroTelefoneHidden.value;
        const cep = ui.elementos.cadastroCepInput.value.trim();
        const rua = ui.elementos.cadastroRuaInput.value.trim();
        const numero = ui.elementos.cadastroNumeroInput.value.trim();
        const bairro = ui.elementos.cadastroBairroInput.value.trim();
        const cidade = ui.elementos.cadastroCidadeInput.value.trim();
        const estado = ui.elementos.cadastroEstadoInput.value.trim();

        const enderecoCompleto = `${rua}, ${numero}, ${bairro} - ${cidade}/${estado} (CEP: ${cep})`;

        if (!nome || !rua || !numero || !bairro || !cidade || !estado) {
            return ui.mostrarMensagem('Preencha o Nome e todos os campos de Endereço.', 'error');
        }
        
        ui.elementos.btnFinalizarCadastro.disabled = true;
        ui.elementos.btnFinalizarCadastro.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finalizando...';

        try {
            const dadosCliente = {
                nome: nome,
                telefone: telefone,
                endereco: enderecoCompleto, 
                auth_id: 'guest-' + telefone
            };
            const novoCliente = await api.finalizarCadastroNoSupabase(dadosCliente);

            app.clientePerfil = novoCliente;
            ui.mostrarMensagem(`Cadastro de ${nome.split(' ')[0]} concluído!`, 'success');
            logarClienteManual(true);

        } catch (error) {
            console.error('Erro no cadastro:', error);
            ui.mostrarMensagem('Erro ao finalizar cadastro: ' + error.message, 'error');
        } finally {
            ui.elementos.btnFinalizarCadastro.disabled = false;
            ui.elementos.btnFinalizarCadastro.innerHTML = 'Finalizar Cadastro';
        }
    }
    
    /**
     * Atualiza a UI após o login e inicia o rastreamento, se houver.
     * @param {boolean} [mostrarMensagemBemVindo=true] - Exibe a mensagem de boas-vindas.
     */
    function logarClienteManual(mostrarMensagemBemVindo = true) {
        localStorage.setItem('clienteTelefone', app.clientePerfil.telefone);
        app.clienteLogado = { id: app.clientePerfil.telefone, email: app.clientePerfil.telefone }; 
        
        ui.elementos.authScreen.classList.remove('active');
        ui.elementos.mobileNav.style.display = 'flex';
        
        if(mostrarMensagemBemVindo) {
            ui.alternarView('view-cardapio'); // Leva para o cardápio se for login novo
        }
        
        ui.elementos.navItems.forEach(item => item.classList.remove('active'));
        document.querySelector('.bottom-nav .nav-item[data-view="view-cardapio"]')?.classList.add('active');

        atualizarPerfilUI();
        
        // Verifica se há um pedido ativo para rastrear
        const pedidoIdSalvo = localStorage.getItem('pedidoAtivoId');
        if (pedidoIdSalvo) {
            app.Rastreamento.iniciarRastreamento(pedidoIdSalvo);
        } else {
            app.Rastreamento.carregarStatusUltimoPedido();
        }
    }

    /**
     * Desloga o cliente e limpa a sessão.
     */
    function fazerLogoutApp() {
        localStorage.removeItem('clienteTelefone');
        localStorage.removeItem('pedidoAtivoId');
        
        app.Rastreamento.pararRastreamento();
        
        app.clienteLogado = null;
        app.clientePerfil = { nome: null, telefone: null, endereco: null };
        ui.elementos.mobileNav.style.display = 'none';
        
        ui.elementos.authTelefoneInput.value = '';
        ui.elementos.cadastroForm.style.display = 'none';
        ui.elementos.loginFormGroup.style.display = 'block';

        ui.mostrarMensagem('Sessão encerrada.', 'info');
        ui.alternarView('auth-screen');
    }

    /**
     * Atualiza os elementos da UI com dados do perfil do cliente.
     */
    function atualizarPerfilUI() {
        const perfil = app.clientePerfil;
        const elementos = ui.elementos;
        
        if (app.clienteLogado) {
            elementos.homeClienteNome.textContent = perfil.nome.split(' ')[0];
            elementos.carrinhoClienteNomeDisplay.textContent = perfil.nome || 'N/A';
            elementos.carrinhoEnderecoDisplay.textContent = perfil.endereco || 'N/A';
            elementos.carrinhoEnderecoInput.value = perfil.endereco || '';
            elementos.homeEndereco.innerHTML = `<strong>Endereço Atual:</strong><br>${perfil.endereco || 'Endereço não cadastrado.'}`;
        } else {
            elementos.homeClienteNome.textContent = 'Visitante';
        }
    }
    
    /**
     * Salva o endereço editado no modal.
     */
    async function salvarEdicaoEndereco(e) {
        e.preventDefault();
        const telefone = app.clientePerfil.telefone;
        const cep = ui.elementos.modalCepInput.value.trim();
        const rua = ui.elementos.modalRuaInput.value.trim();
        const numero = ui.elementos.modalNumeroInput.value.trim();
        const bairro = ui.elementos.modalBairroInput.value.trim();
        const cidade = ui.elementos.modalCidadeInput.value.trim();
        const estado = ui.elementos.modalEstadoInput.value.trim();
        
        if (!rua || !numero || !bairro || !cep || !cidade || !estado) {
            return ui.mostrarMensagem('Preencha a Rua, Número, Bairro, CEP, Cidade e Estado.', 'error');
        }
        
        const enderecoCompleto = `${rua}, ${numero}, ${bairro} - ${cidade}/${estado} (CEP: ${cep})`;

        try {
            await api.salvarEdicaoEnderecoNoSupabase(telefone, enderecoCompleto);
            
            app.clientePerfil.endereco = enderecoCompleto;
            ui.mostrarMensagem('✅ Endereço atualizado com sucesso!', 'success');
            ui.fecharModal(ui.elementos.modalEditarEndereco);
            atualizarPerfilUI(); 
            app.Rastreamento.carregarStatusUltimoPedido(); 

        } catch (error) {
            console.error('Erro ao salvar endereço:', error);
            ui.mostrarMensagem('Erro ao salvar endereço. Verifique sua conexão.', 'error');
        }
    }

    // Expõe as funções para o objeto global AppAuth
    window.AppAuth = {
        verificarSessaoLocal,
        iniciarSessao,
        finalizarCadastro,
        logarClienteManual,
        fazerLogoutApp,
        atualizarPerfilUI,
        salvarEdicaoEndereco
    };

})();