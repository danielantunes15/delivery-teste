// js/checkout.js - Módulo de Finalização de Pedido (Corrigido)

(function() {
    
    // Define o estado inicial do passo no app global
    // REMOVIDO: window.app.passoAtual = 1; (Agora definido em app.js)
    // REMOVIDO: window.app.cupomAplicado = null; (Agora definido em app.js)
    
    /**
     * Alterna entre os passos (1, 2, 3) do checkout.
     * @param {number} novoPasso - O número do passo a ser exibido.
     */
    function alternarPasso(novoPasso) {
        const elementos = window.AppUI.elementos;
        window.app.passoAtual = novoPasso;

        [elementos.stepCarrinho, elementos.stepEntrega, elementos.stepPagamento].forEach(step => {
            step.classList.remove('active');
        });

        if (novoPasso === 1) {
            elementos.stepCarrinho.classList.add('active');
            elementos.btnPassoAnterior.style.display = 'none';
            elementos.btnContinuar.style.display = 'flex';
            elementos.finalizarPedidoDireto.style.display = 'none';
        } else if (novoPasso === 2) {
            elementos.stepEntrega.classList.add('active');
            elementos.btnPassoAnterior.style.display = 'flex';
            elementos.btnContinuar.style.display = 'flex';
            elementos.finalizarPedidoDireto.style.display = 'none';
            // Recarrega os dados de endereço na tela
            window.app.Auth.atualizarPerfilUI();
        } else if (novoPasso === 3) {
            elementos.stepPagamento.classList.add('active');
            elementos.btnPassoAnterior.style.display = 'flex';
            elementos.btnContinuar.style.display = 'none';
            elementos.finalizarPedidoDireto.style.display = 'flex';
        }
    }
    
    /**
     * Valida o passo atual e avança para o próximo ou volta.
     */
    function navegarPasso(direcao) {
        let proximoPasso = window.app.passoAtual + direcao;

        if (proximoPasso === 2) {
            // Validação do Passo 1 (Carrinho)
            if (window.app.carrinho.length === 0) {
                 return window.AppUI.mostrarMensagem('Adicione itens à sacola para continuar!', 'error');
            }
        }
        if (proximoPasso === 3) {
            // Validação do Passo 2 (Entrega)
            if (!window.app.clientePerfil.endereco || window.app.clientePerfil.endereco.length < 10) {
                 return window.AppUI.mostrarMensagem('O endereço de entrega está incompleto. Use o botão "Trocar" para corrigir.', 'error');
            }
        }

        if (proximoPasso >= 1 && proximoPasso <= 3) {
            alternarPasso(proximoPasso);
        }
    }
    
    /**
     * Simula a validação e aplicação de um cupom de desconto.
     */
    function aplicarCupom() {
        const elementos = window.AppUI.elementos;
        const codigo = elementos.cupomInput.value.toUpperCase().trim();
        const subTotal = window.app.Carrinho.calcularTotalComAjustes(0).subTotal;
        
        if (subTotal === 0) {
            elementos.cupomMessage.textContent = 'Adicione itens à sacola antes de usar o cupom.';
            elementos.cupomMessage.style.color = 'var(--warning-color)';
            return;
        }

        // Simulação de cupons válidos
        const cuponsValidos = {
            'GANHE10': { tipo: 'percentual', valor: 10, codigo: 'GANHE10' },
            'DESCONTO20': { tipo: 'valor', valor: 20.00, codigo: 'DESCONTO20' },
            'FREE': { tipo: 'valor', valor: 0.00, codigo: 'FREE' } // Para remover
        };

        if (window.app.cupomAplicado && codigo === window.app.cupomAplicado.codigo) {
             window.app.cupomAplicado = null;
             window.app.Carrinho.atualizarCarrinho();
             elementos.cupomMessage.textContent = 'Cupom removido.';
             elementos.cupomMessage.style.color = 'var(--info-color)';
             return;
        }

        if (cuponsValidos[codigo]) {
            const cupom = cuponsValidos[codigo];
            window.app.cupomAplicado = cupom;
            window.app.Carrinho.atualizarCarrinho();
            window.AppUI.mostrarMensagem(`Cupom ${codigo} aplicado!`, 'success');
        } else {
            window.app.cupomAplicado = null;
            window.app.Carrinho.atualizarCarrinho();
            elementos.cupomMessage.textContent = '❌ Código de cupom inválido.';
            elementos.cupomMessage.style.color = 'var(--error-color)';
        }
    }


    /**
     * Coleta os dados do cliente logado.
     */
    function obterDadosCliente() {
        // CORREÇÃO: Acessa window.AppUI diretamente
        const elementos = window.AppUI.elementos;
        
        // CORREÇÃO CRÍTICA: Assume que o endereço vem do perfil/estado
        // (O campo de input direto no checkout foi removido).
        const endereco = window.app.clientePerfil.endereco.trim();
        
        const trocoPara = parseFloat(elementos.trocoParaInput.value) || 0; 
        const observacoes = elementos.pedidoObservacoes.value.trim(); 

        if (window.app.clienteLogado) {
             const nome = window.app.clientePerfil.nome;
             const telefone = window.app.clientePerfil.telefone;
             
             if (!telefone) {
                window.AppUI.alternarView('auth-screen');
                window.AppUI.mostrarMensagem('Sua sessão expirou. Faça login novamente.', 'error');
                return null;
             }
             
             return {
                 nome: nome,
                 telefone: telefone,
                 endereco: endereco,
                 authId: window.app.clienteLogado.id,
                 trocoPara: trocoPara,
                 observacoes: observacoes
             };
        } else {
             window.AppUI.alternarView('auth-screen');
             window.AppUI.mostrarMensagem('🚨 Você precisa estar logado para enviar o pedido.', 'error');
             return null;
        }
    }

    /**
     * Valida todos os dados antes de finalizar (carrinho, cliente, pagamento).
     */
    function validarDados() {
        const dadosCliente = obterDadosCliente();
        const formaPagamentoEl = document.querySelector('.opcoes-pagamento input[name="pagamento"]:checked');
        const calculo = window.app.Carrinho.calcularTotalComAjustes(0); // Passa 0 para forçar o recálculo do subtotal interno
        
        const subTotalProdutos = calculo.subTotal;
        const totalPedido = calculo.totalFinal; // Já inclui desconto e taxa
        
        const carrinho = window.app.carrinho;
        const formatarMoeda = window.AppUI.formatarMoeda;

        if (carrinho.length === 0) {
            window.AppUI.mostrarMensagem('Sua sacola está vazia!', 'error');
            return null;
        }
        
        if (!dadosCliente) return null;
        
        // Validação Final de Endereço/Nome
        if (!dadosCliente.nome || !dadosCliente.telefone || !dadosCliente.endereco || dadosCliente.endereco.length < 10) {
            window.AppUI.mostrarMensagem('Dados de cliente ou endereço incompletos. Por favor, corrija no Passo 2.', 'error');
            alternarPasso(2); // Volta para o passo de entrega
            return null;
        }
        
        if (formaPagamentoEl.value === 'Dinheiro' && dadosCliente.trocoPara > 0 && dadosCliente.trocoPara < totalPedido) {
             window.AppUI.mostrarMensagem('O valor do troco deve ser igual ou maior que o total do pedido.', 'error');
             window.AppUI.elementos.trocoParaInput.focus();
             return null;
        }
        
        if (!formaPagamentoEl) {
            window.AppUI.mostrarMensagem('Por favor, escolha uma forma de pagamento.', 'error');
            return null;
        }
        
        // Monta observações
        let obsCompleta = montarObservacoes(dadosCliente, totalPedido, subTotalProdutos, calculo.valorDesconto);


        return {
            ...dadosCliente,
            formaPagamento: formaPagamentoEl.value,
            total: totalPedido,
            observacoes: obsCompleta,
            itens: carrinho.map(item => ({ 
                produto_id: item.produto.id,
                quantidade: item.quantidade,
                preco_unitario: item.precoFinalItem,
                nome_produto: item.produto.nome 
            }))
        };
    }

    function montarObservacoes(dadosCliente, totalPedido, subTotalProdutos, valorDesconto) {
        const formatarMoeda = window.AppUI.formatarMoeda;
        const taxaEntrega = window.app.configLoja.taxa_entrega || 0;
        let listaItens = "Itens:\n";
        window.app.carrinho.forEach(item => {
            listaItens += `* ${item.quantidade}x ${item.produto.nome} (${formatarMoeda(item.precoFinalItem)})\n`;
            if(item.opcoes && item.opcoes.length > 0) {
                item.opcoes.forEach(op => { listaItens += `  - ${op.grupo}: ${op.nome}\n`; });
            }
            if(item.complementos && item.complementos.length > 0) {
                listaItens += `  - Adicionais: ${item.complementos.map(c => c.nome).join(', ')}\n`;
            }
            if(item.observacao) {
                listaItens += `  - Obs: ${item.observacao}\n`;
            }
        });
        
        let obsCompleta = dadosCliente.observacoes;
        if (dadosCliente.trocoPara > 0) {
             obsCompleta += `\nTROCO NECESSÁRIO: Sim, para ${formatarMoeda(dadosCliente.trocoPara)}`;
        } else if (document.querySelector('.opcoes-pagamento input[name="pagamento"]:checked').value === 'Dinheiro') {
             obsCompleta += `\nTROCO NECESSÁRIO: Não`;
        }
        
        let resumoValores = `
Subtotal: ${formatarMoeda(subTotalProdutos)}
${valorDesconto > 0 ? `Desconto: -${formatarMoeda(valorDesconto)} (${window.app.cupomAplicado.codigo})` : ''}
Taxa Entrega: ${formatarMoeda(taxaEntrega)}
Total: ${formatarMoeda(totalPedido)}
`;

        return `${listaItens}${resumoValores}\nOBSERVAÇÕES ADICIONAIS:\n${obsCompleta}`;
    }

    /**
     * Orquestra a finalização do pedido, salvando no Supabase e abrindo o WhatsApp.
     */
    async function finalizarPedidoEEnviarWhatsApp() { 
        const dados = validarDados();
        if (!dados) return;
        
        const uiElementos = window.AppUI.elementos;
        const formatarMoeda = window.AppUI.formatarMoeda;

        window.AppUI.mostrarMensagem('Processando pedido...', 'info');
        uiElementos.finalizarPedidoDireto.disabled = true;

        try {
            // 1. Criar o pedido_online
            const dadosPedidoSupabase = {
                nome_cliente: dados.nome,
                telefone_cliente: dados.telefone,
                endereco_entrega: dados.endereco,
                forma_pagamento: dados.formaPagamento,
                total: dados.total,
                status: 'novo',
                observacoes: dados.observacoes
            };
            const novoPedido = await window.AppAPI.finalizarPedidoNoSupabase(dadosPedidoSupabase);

            // 2. Atualizar estoque
            for (const item of window.app.carrinho) {
                const produtoNoEstoque = window.app.produtos.find(p => p.id === item.produto.id);
                const novoEstoque = produtoNoEstoque.estoque_atual - item.quantidade;
                await window.AppAPI.atualizarEstoqueNoSupabase(item.produto.id, novoEstoque);
            }

            // 3. Montar a mensagem do WhatsApp (para o link)
            let mensagem = `*PEDIDO ONLINE - DOCE CRIATIVO - #${novoPedido.id}*\n\n`;
            mensagem += `*Cliente:* ${dados.nome}\n`;
            mensagem += `*Telefone:* ${dados.telefone}\n`;
            mensagem += `*Endereço:* ${dados.endereco}\n`;
            mensagem += `*Pagamento:* ${dados.formaPagamento}\n`;
            mensagem += `*TOTAL:* ${formatarMoeda(dados.total)}\n\n`;
            mensagem += `--- DETALHES ---\n`;
            mensagem += dados.observacoes;

            const url = `https://wa.me/${window.app.NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;

            // 4. Limpar o estado e preparar o redirect
            
            // Iniciar Rastreamento e Limpar Carrinho
            localStorage.setItem('pedidoAtivoId', novoPedido.id);
            window.app.Rastreamento.iniciarRastreamento(novoPedido.id);
            
            window.app.Carrinho.limparFormularioECarrinho(); // Limpa o carrinho e reseta os forms
            await window.app.Cardapio.carregarDadosCardapio(); // Recarrega produtos
            
            // 5. Redirecionar para a tela de pedidos e abrir o WhatsApp
            window.AppUI.alternarView('view-inicio'); // Vai para a tela de rastreio/pedidos
            window.AppUI.mostrarMensagem('✅ Pedido registrado com sucesso! Redirecionando e enviando WhatsApp...', 'success');
            
            // Abre o link do WhatsApp
            window.open(url, '_blank');


        } catch (error) {
            console.error("Erro ao finalizar pedido direto:", error);
            window.AppUI.mostrarMensagem(`Erro ao enviar pedido: ${error.message}`, 'error');
            uiElementos.finalizarPedidoDireto.disabled = false; // Habilita o botão em caso de erro
            
        } finally {
            window.app.Cardapio.updateStoreStatus();
        }
    }
    
    /**
     * Configura os listeners específicos do novo stepper.
     */
    function configurarListenersStepper() {
        const elementos = window.AppUI.elementos;

        if (elementos.btnContinuar) elementos.btnContinuar.addEventListener('click', () => navegarPasso(1));
        if (elementos.btnPassoAnterior) elementos.btnPassoAnterior.addEventListener('click', () => navegarPasso(-1));
        if (elementos.finalizarPedidoDireto) elementos.finalizarPedidoDireto.addEventListener('click', finalizarPedidoEEnviarWhatsApp);
        
        if (elementos.limparCarrinhoBtn) elementos.limparCarrinhoBtn.addEventListener('click', window.app.Carrinho.limparCarrinho);
        if (elementos.addMoreItemsBtn) elementos.addMoreItemsBtn.addEventListener('click', () => window.AppUI.alternarView('view-cardapio'));
        
        if (elementos.trocarEnderecoBtn) elementos.trocarEnderecoBtn.addEventListener('click', window.AppUI.abrirModalEditarEndereco);

        // Lógica de Cupom
        if (elementos.aplicarCupomBtn) elementos.aplicarCupomBtn.addEventListener('click', aplicarCupom);
        if (elementos.cupomInput) elementos.cupomInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                aplicarCupom();
            }
        });
    }


    // Expõe as funções para o objeto global AppCheckout
    window.AppCheckout = {
        obterDadosCliente,
        validarDados,
        finalizarPedidoEEnviarWhatsApp,
        alternarPasso, // Exposto para o carrinho poder inicializar
        configurarListenersStepper
    };

    // Adiciona o listener principal do stepper ao app.js
    document.addEventListener('DOMContentLoaded', () => {
         if(window.app.Checkout && window.app.Checkout.configurarListenersStepper) {
            window.app.Checkout.configurarListenersStepper();
         }
    });

})();