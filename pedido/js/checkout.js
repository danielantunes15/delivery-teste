// js/checkout.js - Módulo de Finalização de Pedido

(function() {
    
    const ui = window.AppUI;
    const api = window.AppAPI;
    const app = window.app;
    
    /**
     * Coleta os dados do cliente logado.
     * @returns {object|null} Dados do cliente ou null se não estiver logado.
     */
    function obterDadosCliente() {
        const elementos = ui.elementos;
        const endereco = elementos.carrinhoEnderecoInput.value.trim();
        const trocoPara = parseFloat(elementos.trocoParaInput.value) || 0; 
        const observacoes = elementos.pedidoObservacoes.value.trim(); 

        if (app.clienteLogado) {
             const nome = app.clientePerfil.nome;
             const telefone = app.clientePerfil.telefone;
             
             if (!telefone) {
                ui.alternarView('auth-screen');
                ui.mostrarMensagem('Sua sessão expirou. Faça login novamente.', 'error');
                return null;
             }
             
             return {
                 nome: nome,
                 telefone: telefone,
                 endereco: endereco,
                 authId: app.clienteLogado.id,
                 trocoPara: trocoPara,
                 observacoes: observacoes
             };
        } else {
             ui.alternarView('auth-screen');
             ui.mostrarMensagem('🚨 Você precisa estar logado para enviar o pedido.', 'error');
             return null;
        }
    }

    /**
     * Valida todos os dados antes de finalizar (carrinho, cliente, pagamento).
     * @returns {object|null} Objeto de dados do pedido pronto para API, ou null se inválido.
     */
    function validarDados() {
        const dadosCliente = obterDadosCliente();
        const formaPagamentoEl = document.querySelector('.opcoes-pagamento input[name="pagamento"]:checked');
        const taxaEntrega = app.configLoja.taxa_entrega || 0;
        const carrinho = app.carrinho;

        if (carrinho.length === 0) {
            ui.mostrarMensagem('Sua sacola está vazia!', 'error');
            return null;
        }
        
        if (!dadosCliente) return null;
        
        if (!dadosCliente.nome || !dadosCliente.telefone || !dadosCliente.endereco) {
            ui.mostrarMensagem('Dados do cliente ou endereço incompletos.', 'error');
            return null;
        }
        
        const subTotalProdutos = carrinho.reduce((sum, item) => sum + (item.precoFinalItem * item.quantidade), 0);
        const totalPedido = subTotalProdutos + taxaEntrega;
        
        if (formaPagamentoEl.value === 'Dinheiro' && dadosCliente.trocoPara > 0 && dadosCliente.trocoPara < totalPedido) {
             ui.mostrarMensagem('O valor do troco deve ser igual ou maior que o total do pedido.', 'error');
             ui.elementos.trocoParaInput.focus();
             return null;
        }
        
        if (!formaPagamentoEl) {
            ui.mostrarMensagem('Por favor, escolha uma forma de pagamento.', 'error');
            return null;
        }
        
        let listaItens = "Itens:\n";
        carrinho.forEach(item => {
            listaItens += `* ${item.quantidade}x ${item.produto.nome} (${ui.formatarMoeda(item.precoFinalItem)})\n`;
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
             obsCompleta += `\nTROCO NECESSÁRIO: Sim, para ${ui.formatarMoeda(dadosCliente.trocoPara)}`;
        } else if (formaPagamentoEl.value === 'Dinheiro') {
             obsCompleta += `\nTROCO NECESSÁRIO: Não`;
        }
        
        obsCompleta = `${listaItens}\nSubtotal: ${ui.formatarMoeda(subTotalProdutos)}\nTaxa Entrega: ${ui.formatarMoeda(taxaEntrega)}\nTotal: ${ui.formatarMoeda(totalPedido)}\n\nOBSERVAÇÕES ADICIONAIS:\n${obsCompleta}`;

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

        ui.mostrarMensagem('Processando pedido...', 'info');
        ui.elementos.finalizarDiretoBtn.disabled = true;

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
            const novoPedido = await api.finalizarPedidoNoSupabase(dadosPedidoSupabase);

            // 2. Atualizar estoque
            for (const item of app.carrinho) {
                const produtoNoEstoque = app.produtos.find(p => p.id === item.produto.id);
                const novoEstoque = produtoNoEstoque.estoque_atual - item.quantidade;
                await api.atualizarEstoqueNoSupabase(item.produto.id, novoEstoque);
            }

            // 3. ENVIAR MENSAGEM VIA WHATSAPP
            let mensagem = `*PEDIDO ONLINE - DOCE CRIATIVO*\n\n`;
            mensagem += `*Cliente:* ${dados.nome}\n`;
            mensagem += `*Telefone:* ${dados.telefone}\n`;
            mensagem += `*Endereço:* ${dados.endereco}\n`;
            mensagem += `*Pagamento:* ${dados.formaPagamento}\n`;
            mensagem += `*TOTAL:* ${ui.formatarMoeda(dados.total)}\n\n`;
            mensagem += `--- DETALHES ---\n`;
            mensagem += dados.observacoes; // Já contém tudo formatado

            const url = `https://wa.me/${app.NUMERO_WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
            window.open(url, '_blank');

            ui.mostrarMensagem('✅ Pedido registrado! Acompanhe o status na tela "Pedidos".', 'success');
            
            // 4. Iniciar Rastreamento
            localStorage.setItem('pedidoAtivoId', novoPedido.id);
            app.Rastreamento.iniciarRastreamento(novoPedido.id);
            
            // 5. Limpar tudo
            app.Carrinho.limparFormularioECarrinho();
            await app.Cardapio.carregarDadosCardapio(); // Recarrega produtos (estoque)
            
            ui.alternarView('view-inicio'); // Muda para a tela de Pedidos/Perfil

        } catch (error) {
            console.error("Erro ao finalizar pedido direto:", error);
            ui.mostrarMensagem(`Erro ao enviar pedido: ${error.message}`, 'error');
        } finally {
            // Re-habilita o botão com base no status da loja
            app.Cardapio.updateStoreStatus();
        }
    }

    // Expõe as funções para o objeto global AppCheckout
    window.AppCheckout = {
        obterDadosCliente,
        validarDados,
        finalizarPedidoEEnviarWhatsApp
    };

})();