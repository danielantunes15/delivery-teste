// js/checkout.js - Módulo de Finalização de Pedido (Corrigido para TELA ÚNICA)

(function() {
    
    // NOTA: A navegação por passos foi removida.
    // O botão de finalizar agora chama 'finalizarPedidoEEnviarWhatsApp' diretamente.
    
    /**
     * Coleta os dados do cliente logado.
     */
    function obterDadosCliente() {
        const elementos = window.AppUI.elementos;
        
        // Assume que o endereço vem do perfil/estado (que é atualizado pelo modal de edição)
        const endereco = window.app.clientePerfil.endereco.trim();
        
        const trocoPara = parseFloat(elementos.trocoParaInput?.value) || 0; 
        const observacoes = elementos.pedidoObservacoes?.value.trim() || ''; 

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
        const calculo = window.app.Carrinho.calcularTotalComAjustes(0); 
        
        const subTotalProdutos = calculo.subTotal;
        const totalPedido = calculo.totalFinal; 
        
        const carrinho = window.app.carrinho;

        if (carrinho.length === 0) {
            window.AppUI.mostrarMensagem('Sua sacola está vazia!', 'error');
            return null;
        }
        
        if (!dadosCliente) return null;
        
        // Validação de Endereço Mínima
        if (!dadosCliente.endereco || dadosCliente.endereco.length < 10) {
            window.AppUI.mostrarMensagem('O endereço de entrega está incompleto. Use o botão "Trocar Endereço" para corrigir.', 'error');
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
             obsCompleta += `\nTROCO NECESSÁRIO: Sim, para ${window.AppUI.formatarMoeda(dadosCliente.trocoPara)}`;
        } else if (document.querySelector('.opcoes-pagamento input[name="pagamento"]:checked')?.value === 'Dinheiro') {
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
     * Finaliza o pedido, salva no Supabase e abre o link do WhatsApp.
     */
    async function finalizarPedidoEEnviarWhatsApp() { 
        const dados = validarDados();
        if (!dados) return;
        
        const uiElementos = window.AppUI.elementos;

        window.AppUI.mostrarMensagem('Processando pedido...', 'info');
        if (uiElementos.finalizarPedidoDireto) uiElementos.finalizarPedidoDireto.disabled = true;

        try {
            // 1. Criar o pedido_online (Salva no DB)
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
            mensagem += `*TOTAL:* ${window.AppUI.formatarMoeda(dados.total)}\n\n`;
            mensagem += `--- DETALHES ---\n`;
            mensagem += dados.observacoes;

            const url = `https://wa.me/${window.app.NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;

            // 4. Limpar o estado e iniciar rastreamento
            localStorage.setItem('pedidoAtivoId', novoPedido.id);
            window.app.Rastreamento.iniciarRastreamento(novoPedido.id);
            
            window.app.Carrinho.limparFormularioECarrinho(); 
            await window.app.Cardapio.carregarDadosCardapio(); 
            
            // 5. Redirecionar e abrir o WhatsApp
            window.AppUI.alternarView('view-inicio'); 
            window.AppUI.mostrarMensagem('✅ Pedido registrado com sucesso! Redirecionando e enviando WhatsApp...', 'success');
            
            // Abre o link do WhatsApp
            window.open(url, '_blank');


        } catch (error) {
            console.error("Erro ao finalizar pedido:", error);
            window.AppUI.mostrarMensagem(`Erro ao enviar pedido: ${error.message}`, 'error');
            if (uiElementos.finalizarPedidoDireto) uiElementos.finalizarPedidoDireto.disabled = false;
            
        } finally {
            window.app.Cardapio.updateStoreStatus();
        }
    }
    
    /**
     * Configura os listeners específicos do novo layout.
     */
    function configurarListenersSingleScreen() {
        const elementos = window.AppUI.elementos;

        // Botão Finalizar (Chama a função que faz tudo)
        if (elementos.finalizarPedidoDireto) {
            elementos.finalizarPedidoDireto.addEventListener('click', finalizarPedidoEEnviarWhatsApp);
        }
        
        // Botão Adicionar Mais Itens (Volta para o cardápio)
        if (elementos.addMoreItemsBtn) {
            elementos.addMoreItemsBtn.addEventListener('click', () => window.AppUI.alternarView('view-cardapio'));
        }
        
        // Botão Trocar Endereço (Abre o modal)
        if (elementos.trocarEnderecoBtn) {
            elementos.trocarEnderecoBtn.addEventListener('click', window.AppUI.abrirModalEditarEndereco);
        }

        // Botão Limpar Carrinho
        if (elementos.limparCarrinhoBtn) {
            elementos.limparCarrinhoBtn.addEventListener('click', window.app.Carrinho.limparCarrinho);
        }

        // Lógica de Cupom (mantida a lógica de simulação)
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
        // Renomeada para melhor contexto
        configurarListenersSingleScreen 
    };

    // Adiciona o listener principal ao app.js
    document.addEventListener('DOMContentLoaded', () => {
         if(window.app.Checkout && window.app.Checkout.configurarListenersSingleScreen) {
            window.app.Checkout.configurarListenersSingleScreen();
         }
    });

})();