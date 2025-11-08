// js/rastreamento.js - Módulo de Rastreamento de Pedidos e Histórico

(function() {

    const ui = window.AppUI;
    const api = window.AppAPI;
    const app = window.app;
    
    /**
     * Inicia o ouvinte de Realtime do Supabase para um pedido específico.
     * @param {string} pedidoId - O ID do pedido a ser rastreado.
     */
    async function iniciarRastreamento(pedidoId) {
        if (!pedidoId) return;
        
        app.pedidoAtivoId = pedidoId;
        console.log(`Iniciando rastreamento para o pedido: ${pedidoId}`);
        
        ui.elementos.statusUltimoPedido.innerHTML = '';
        
        pararRastreamento(); // Remove qualquer ouvinte antigo

        // 1. Busca o status atual do pedido
        const pedido = await api.buscarPedidoParaRastreamento(pedidoId);
        if (!pedido) {
            console.log("Pedido não encontrado, limpando tracker.");
            localStorage.removeItem('pedidoAtivoId');
            app.pedidoAtivoId = null;
            carregarStatusUltimoPedido();
            return;
        }
        
        atualizarTrackerUI(pedido);

        // 2. Ouve por atualizações futuras
        app.supabaseChannel = window.supabase.channel(`pedido-${pedidoId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pedidos_online',
                    filter: `id=eq.${pedidoId}`
                },
                (payload) => {
                    console.log('Status do pedido atualizado via Realtime!', payload.new);
                    atualizarTrackerUI(payload.new);
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Canal de rastreamento para ${pedidoId} iniciado.`);
                }
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('Erro no canal de rastreamento:', err);
                }
            });
    }

    /**
     * Para o ouvinte de Realtime atual.
     */
    function pararRastreamento() {
        if (app.supabaseChannel) {
            window.supabase.removeChannel(app.supabaseChannel);
            app.supabaseChannel = null;
            app.pedidoAtivoId = null;
            console.log("Canal de rastreamento interrompido.");
        }
    }

    /**
     * Atualiza a interface da barra de rastreamento.
     * @param {object} pedido - O objeto do pedido com 'id' e 'status'.
     */
    function atualizarTrackerUI(pedido) {
        const elementos = ui.elementos;
        if (!pedido) {
            localStorage.removeItem('pedidoAtivoId');
            app.pedidoAtivoId = null;
            elementos.rastreamentoContainer.style.display = 'none';
            pararRastreamento();
            carregarStatusUltimoPedido();
            return;
        }

        elementos.rastreamentoPedidoId.textContent = `#${pedido.id}`;
        elementos.rastreamentoContainer.style.display = 'block';

        const steps = [elementos.stepNovo, elementos.stepPreparando, elementos.stepPronto, elementos.stepEntregue];
        steps.forEach(step => step.classList.remove('active', 'completed'));
        
        elementos.stepEntregue.querySelector('i').className = 'fas fa-check-circle';
        elementos.stepEntregue.style.color = '';
        elementos.stepEntregue.querySelector('i').style.background = '';

        if (pedido.status === 'novo') {
            elementos.stepNovo.classList.add('active');
            elementos.rastreamentoStatusTexto.textContent = 'Pedido recebido pela loja!';
        } else if (pedido.status === 'preparando') {
            elementos.stepNovo.classList.add('completed');
            elementos.stepPreparando.classList.add('active');
            elementos.rastreamentoStatusTexto.textContent = 'Seu pedido está sendo preparado!';
        } else if (pedido.status === 'pronto') {
            elementos.stepNovo.classList.add('completed');
            elementos.stepPreparando.classList.add('completed');
            elementos.stepPronto.classList.add('active');
            elementos.rastreamentoStatusTexto.textContent = 'Seu pedido está pronto para sair!';
        } else if (pedido.status === 'entregue' || pedido.status === 'cancelado') {
            steps.forEach(s => s.classList.add('completed'));
            
            if (pedido.status === 'cancelado') {
                elementos.stepEntregue.querySelector('i').className = 'fas fa-times-circle';
                elementos.stepEntregue.style.color = '#c62828';
                elementos.stepEntregue.querySelector('i').style.background = '#c62828';
                elementos.rastreamentoStatusTexto.textContent = 'Seu pedido foi cancelado.';
            } else {
                elementos.rastreamentoStatusTexto.textContent = 'Pedido entregue! Bom apetite!';
            }

            setTimeout(() => {
                localStorage.removeItem('pedidoAtivoId');
                app.pedidoAtivoId = null;
                elementos.rastreamentoContainer.style.display = 'none';
                carregarStatusUltimoPedido();
            }, 5000);
            
            pararRastreamento();
        }
    }

    /**
     * Carrega o histórico de pedidos antigos (se nenhum pedido estiver ativo).
     */
    async function carregarStatusUltimoPedido() {
        const elementos = ui.elementos;
        if (app.pedidoAtivoId) {
            elementos.statusUltimoPedido.innerHTML = '';
            return;
        }
        
        elementos.rastreamentoContainer.style.display = 'none';
        elementos.statusUltimoPedido.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando histórico...';
        
        if (!app.clienteLogado) {
            elementos.statusUltimoPedido.innerHTML = '<p>Faça login para ver o status e o histórico de pedidos.</p>';
            return;
        }

        try {
            const pedidos = await api.buscarHistoricoPedidos(app.clientePerfil.telefone);
            app.historicoPedidos = pedidos;
            
            let htmlHistorico = '';
            if (pedidos.length > 0) {
                 htmlHistorico += '<h4>Últimos Pedidos:</h4>';
                 pedidos.forEach((p) => {
                     const dataPedido = new Date(p.created_at).toLocaleDateString('pt-BR');
                     const status = (p.status || 'novo').toUpperCase();
                     
                     // Lógica de parse (simplificada)
                     const listaItens = p.observacoes.split('\n').find(l => l.startsWith('*')) || 'Detalhes do pedido';
                     
                     htmlHistorico += `
                         <div class="card-pedido-historico" data-id="${p.id}">
                             <p style="font-weight: bold; margin: 0;">Pedido #${p.id} - ${dataPedido}</p>
                             <p style="font-size: 0.9rem; margin: 0; color: #555;">${listaItens.replace('* ','').substring(0, 40)}...</p>
                             <p style="font-size: 0.9rem; margin: 0;">Status: 
                                 <span class="status-badge-history status-${status}">
                                     ${status}
                                 </span>
                                 | Total: ${ui.formatarMoeda(p.total)}
                             </p>
                         </div>
                     `;
                 });
            } else {
                 htmlHistorico = 'Você ainda não fez nenhum pedido conosco!';
            }
            
            elementos.statusUltimoPedido.innerHTML = htmlHistorico;
            
            // Adiciona cliques para abrir o modal de detalhes do histórico
            elementos.statusUltimoPedido.querySelectorAll('.card-pedido-historico').forEach(card => {
                card.addEventListener('click', (e) => {
                    const pedidoId = e.currentTarget.dataset.id;
                    abrirModalDetalhesPedido(pedidoId);
                });
            });
            
        } catch (error) {
            elementos.statusUltimoPedido.innerHTML = 'Erro ao carregar histórico.';
            console.error('Erro ao carregar status do pedido:', error);
        }
    }
    
    /**
     * Abre o modal com os detalhes de um pedido do histórico.
     * @param {string} pedidoId - O ID do pedido do histórico.
     */
    function abrirModalDetalhesPedido(pedidoId) {
        const pedido = app.historicoPedidos.find(p => p.id.toString() === pedidoId);
        if (!pedido) {
            ui.mostrarMensagem('Detalhes do pedido não encontrados.', 'error');
            return;
        }

        const dataPedido = new Date(pedido.created_at).toLocaleString('pt-BR');
        const status = (pedido.status || 'novo').toUpperCase();
        
        // Parse da observação
        const obsLines = pedido.observacoes.split('\n');
        let itensListHtml = '';
        let obsAdicionais = '';
        let isItemList = false;

        for (let i = 0; i < obsLines.length; i++) {
            const line = obsLines[i];
            if (line.includes('Itens:')) { isItemList = true; continue; }
            if (line.includes('Total:') || line.includes('OBSERVAÇÕES ADICIONAIS:')) {
                isItemList = false;
                if (line.includes('OBSERVAÇÕES ADICIONAIS:')) {
                    obsAdicionais = obsLines.slice(i).join('\n');
                }
                continue;
            }
            if (isItemList && line.trim() !== '') {
                itensListHtml += `<p style="margin: 3px 0; font-size: 0.9rem;">- ${line.replace('*', '').trim()}</p>`;
            }
        }
        const cleanedObsAdicionais = obsAdicionais.replace('OBSERVAÇÕES ADICIONAIS:', '').trim();
        
        const elementos = ui.elementos;
        elementos.detalhesPedidoId.textContent = `#${pedido.id}`;
        elementos.detalhesPedidoContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h4 style="margin: 0; font-size: 1.5rem;">${ui.formatarMoeda(pedido.total)}</h4>
                <span class="status-badge-history status-${status}" style="margin-top: 5px;">
                    <i class="fas fa-info-circle"></i> STATUS: ${status}
                </span>
            </div>
            
            <h5 style="border-bottom: 1px dashed #eee; padding-bottom: 5px; margin-top: 15px; font-weight: bold;">Detalhes da Entrega</h5>
            <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Data/Hora:</strong> ${dataPedido}</p>
            <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Cliente:</strong> ${pedido.nome_cliente}</p>
            <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Endereço:</strong> ${pedido.endereco_entrega}</p>
            <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Pagamento:</strong> ${pedido.forma_pagamento}</p>
            
            <h5 style="border-bottom: 1px dashed #eee; padding-bottom: 5px; margin-top: 15px; font-weight: bold;">Itens Solicitados</h5>
            ${itensListHtml || '<p style="font-size: 0.9rem; color: #999;">Nenhum item detalhado.</p>'}
            
            ${cleanedObsAdicionais ? 
                `<h5 style="border-bottom: 1px dashed #eee; padding-bottom: 5px; margin-top: 15px; font-weight: bold;">Observações</h5>
                 <pre style="white-space: pre-wrap; font-size: 0.85rem; color: #555; background: #f9f9f9; padding: 10px; border-radius: 5px;">${cleanedObsAdicionais}</pre>` 
                : ''}
        `;
        elementos.modalDetalhesPedido.style.display = 'flex';
    }


    // Expõe as funções para o objeto global AppRastreamento
    window.AppRastreamento = {
        iniciarRastreamento,
        pararRastreamento,
        atualizarTrackerUI,
        carregarStatusUltimoPedido,
        abrirModalDetalhesPedido
    };

})();