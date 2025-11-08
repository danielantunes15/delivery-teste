// js/checkout.js - Módulo de Finalização de Pedido (Corrigido)

(function() {
    
    // const ui = window.AppUI; // <-- REMOVIDO
    // const api = window.AppAPI; // <-- REMOVIDO
    
    /**
     * Coleta os dados do cliente logado.
     */
    function obterDadosCliente() {
        // CORREÇÃO: Acessa window.AppUI diretamente
        const elementos = window.AppUI.elementos;
        const endereco = elementos.carrinhoEnderecoInput.value.trim();
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
        const taxaEntrega = window.app.configLoja.taxa_entrega || 0;
        const carrinho = window.app.carrinho;
        const formatarMoeda = window.AppUI.formatarMoeda; // Pega a função utilitária

        if (carrinho.length === 0) {
            window.AppUI.mostrarMensagem('Sua sacola está vazia!', 'error');
            return null;
        }
        
        if (!dadosCliente) return null;
        
        if (!dadosCliente.nome || !dadosCliente.telefone || !dadosCliente.endereco) {
            window.AppUI.mostrarMensagem('Dados do cliente ou endereço incompletos.', 'error');
            return null;
        }
        
        const subTotalProdutos = carrinho.reduce((sum, item) => sum + (item.precoFinalItem * item.quantidade), 0);
        const totalPedido = subTotalProdutos + taxaEntrega;
        
        if (formaPagamentoEl.value === 'Dinheiro' && dadosCliente.trocoPara > 0 && dadosCliente.trocoPara < totalPedido) {
             window.AppUI.mostrarMensagem('O valor do troco deve ser igual ou maior que o total do pedido.', 'error');
             window.AppUI.elementos.trocoParaInput.focus();
             return null;
        }
        
        if (!formaPagamentoEl) {
            window.AppUI.mostrarMensagem('Por favor, escolha uma forma de pagamento.', 'error');
            return null;
        }
        
        let listaItens = "Itens:\n";
        carrinho.forEach(item => {
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
        } else if (formaPagamentoEl.value === 'Dinheiro') {
             obsCompleta += `\nTROCO NECESSÁRIO: Não`;
        }
        
        obsCompleta = `${listaItens}\nSubtotal: ${formatarMoeda(subTotalProdutos)}\nTaxa Entrega: ${formatarMoeda(taxaEntrega)}\nTotal: ${formatarMoeda(totalPedido)}\n\nOBSERVAÇÕES ADICIONAIS:\n${obsCompleta}`;

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

    /**
     * Orquestra a finalização do pedido, salvando no Supabase e abrindo o WhatsApp.
     */
    async function finalizarPedidoEEnviarWhatsApp() { 
        const dados = validarDados();
        if (!dados) return;
        
        const uiElementos = window.AppUI.elementos;
        const formatarMoeda = window.AppUI.formatarMoeda;

        window.AppUI.mostrarMensagem('Processando pedido...', 'info');
        uiElementos.finalizarDiretoBtn.disabled = true;

        try {
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

            for (const item of window.app.carrinho) {
                const produtoNoEstoque = window.app.produtos.find(p => p.id === item.produto.id);
                const novoEstoque = produtoNoEstoque.estoque_atual - item.quantidade;
                await window.AppAPI.atualizarEstoqueNoSupabase(item.produto.id, novoEstoque);
            }

            let mensagem = `*PEDIDO ONLINE - DOCE CRIATIVO*\n\n`;
            mensagem += `*Cliente:* ${dados.nome}\n`;
            mensagem += `*Telefone:* ${dados.telefone}\n`;
            mensagem += `*Endereço:* ${dados.endereco}\n`;
            mensagem += `*Pagamento:* ${dados.formaPagamento}\n`;
            mensagem += `*TOTAL:* ${formatarMoeda(dados.total)}\n\n`;
            mensagem += `--- DETALHES ---\n`;
            mensagem += dados.observacoes;

            const url = `https://wa.me/${window.app.NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
            window.open(url, '_blank');

            window.AppUI.mostrarMensagem('✅ Pedido registrado! Acompanhe o status na tela "Pedidos".', 'success');
            
            localStorage.setItem('pedidoAtivoId', novoPedido.id);
            window.app.Rastreamento.iniciarRastreamento(novoPedido.id);
            
            window.app.Carrinho.limparFormularioECarrinho();
            await window.app.Cardapio.carregarDadosCardapio();
            
            window.AppUI.alternarView('view-inicio');

        } catch (error) {
            console.error("Erro ao finalizar pedido direto:", error);
            window.AppUI.mostrarMensagem(`Erro ao enviar pedido: ${error.message}`, 'error');
        } finally {
            window.app.Cardapio.updateStoreStatus();
        }
    }

    // Expõe as funções para o objeto global AppCheckout
    window.AppCheckout = {
        obterDadosCliente,
        validarDados,
        finalizarPedidoEEnviarWhatsApp
    };

})();