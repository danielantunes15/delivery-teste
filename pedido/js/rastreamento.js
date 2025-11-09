// js/rastreamento.js - Módulo de Rastreamento de Pedidos e Histórico (Versão Moderna)

(function() {

    /**
     * Inicia o ouvinte de Realtime do Supabase para um pedido específico.
     */
    async function iniciarRastreamento(pedidoId) {
        if (!pedidoId) return;
        
        window.app.pedidoAtivoId = pedidoId;
        console.log(`Iniciando rastreamento para o pedido: ${pedidoId}`);
        
        // Limpa a visualização do histórico enquanto rastreamos um pedido ativo
        window.AppUI.elementos.statusUltimoPedido.innerHTML = '';
        
        pararRastreamento(); 

        const pedido = await window.AppAPI.buscarPedidoParaRastreamento(pedidoId);
        if (!pedido) {
            console.log("Pedido não encontrado, limpando tracker.");
            localStorage.removeItem('pedidoAtivoId');
            window.app.pedidoAtivoId = null;
            carregarStatusUltimoPedido();
            return;
        }
        
        atualizarTrackerUI(pedido); 

        window.app.supabaseChannel = window.supabase.channel(`pedido-${pedidoId}`)
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
        if (window.app.supabaseChannel) {
            window.supabase.removeChannel(window.app.supabaseChannel);
            window.app.supabaseChannel = null;
            window.app.pedidoAtivoId = null;
            console.log("Canal de rastreamento interrompido.");
        }
    }

    /**
     * Calcula a previsão de entrega e atualiza a interface da barra de rastreamento.
     */
    function atualizarTrackerUI(pedido) {
        const elementos = window.AppUI.elementos;
        if (!pedido) {
            localStorage.removeItem('pedidoAtivoId');
            window.app.pedidoAtivoId = null;
            elementos.rastreamentoContainer.style.display = 'none';
            pararRastreamento();
            carregarStatusUltimoPedido();
            return;
        }

        const tempoEntregaMinutos = window.app.configLoja.tempo_entrega || 60;
        const criadoEm = new Date(pedido.created_at);
        const dataPrevisao = new Date(criadoEm.getTime() + tempoEntregaMinutos * 60000);
        
        const horaPrevisao = dataPrevisao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        elementos.rastreamentoPedidoId.textContent = `#${pedido.id}`;
        elementos.rastreamentoContainer.style.display = 'block';

        const steps = [elementos.stepNovo, elementos.stepPreparando, elementos.stepPronto, elementos.stepEntregue];
        steps.forEach(step => step.classList.remove('active', 'completed'));
        
        // CORREÇÃO: Reseta a customização do ícone de entrega
        elementos.stepEntregue.querySelector('i').className = 'fas fa-check-circle';
        elementos.stepEntregue.style.color = '';
        elementos.stepEntregue.querySelector('i').style.background = '';
        
        let statusText = '';
        let subtituloText = '';

        if (pedido.status === 'novo') {
            elementos.stepNovo.classList.add('active');
            statusText = 'Pedido recebido pela loja! Aguardando confirmação.';
            subtituloText = 'aguardando confirmação.';
        } else if (pedido.status === 'preparando') {
            elementos.stepNovo.classList.add('completed');
            elementos.stepPreparando.classList.add('active');
            statusText = `Seu pedido está sendo preparado! Previsão de entrega: ${horaPrevisao}.`;
            subtituloText = 'em preparo.';
        } else if (pedido.status === 'pronto') {
            elementos.stepNovo.classList.add('completed');
            elementos.stepPreparando.classList.add('completed');
            elementos.stepPronto.classList.add('active');
            statusText = `Seu pedido saiu para entrega! Previsão de chegada: ${horaPrevisao}.`;
            subtituloText = 'a caminho!';
        } else if (pedido.status === 'entregue' || pedido.status === 'cancelado') {
            
            if (pedido.status === 'entregue') {
                 steps.forEach(s => s.classList.add('completed'));
                 subtituloText = 'foi entregue.';
            }
            
            if (pedido.status === 'cancelado') {
                steps.forEach(s => s.classList.add('completed'));
                elementos.stepEntregue.classList.remove('completed'); 
                elementos.stepEntregue.classList.add('active'); 
                elementos.stepEntregue.querySelector('i').className = 'fas fa-times-circle';
                elementos.stepEntregue.style.color = '#c62828';
                elementos.stepEntregue.querySelector('i').style.background = '#c62828';
                statusText = 'Seu pedido foi cancelado.';
                subtituloText = 'foi cancelado.';
            } else {
                statusText = 'Pedido entregue! Bom apetite!';
            }

            // Acompanhamento finalizado, limpa o estado ativo após 5s
            setTimeout(() => {
                localStorage.removeItem('pedidoAtivoId');
                window.app.pedidoAtivoId = null;
                elementos.rastreamentoContainer.style.display = 'none';
                carregarStatusUltimoPedido();
            }, 5000);
            
            pararRastreamento();
        }
        
        elementos.rastreamentoStatusTexto.textContent = statusText;
        if (elementos.rastreamentoSubtitulo) elementos.rastreamentoSubtitulo.textContent = subtituloText;
    }

    /**
     * Carrega o histórico de pedidos com layout moderno
     */
    async function carregarStatusUltimoPedido() {
        const elementos = window.AppUI.elementos;
        const container = elementos.statusUltimoPedido;
        
        if (window.app.pedidoAtivoId) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Carregando seus pedidos...</div>';
        
        if (!window.app.clienteLogado) {
            container.innerHTML = '<p>Faça login para ver o status e o histórico de pedidos.</p>';
            return;
        }

        try {
            const todosPedidos = await window.AppAPI.buscarHistoricoPedidos(window.app.clientePerfil.telefone, 100);
            window.app.todosPedidosCliente = todosPedidos;
            
            if (todosPedidos.length === 0) {
                elementos.semPedidosMessage.style.display = 'block';
                elementos.historicoUltimosPedidos.style.display = 'none';
                elementos.pedidosAtivosContainer.style.display = 'none';
                return;
            }

            // Separar pedidos ativos e finalizados
            const pedidosAtivos = todosPedidos.filter(pedido => 
                !['entregue', 'cancelado'].includes(pedido.status?.toLowerCase())
            );
            
            const pedidosFinalizados = todosPedidos.filter(pedido => 
                ['entregue', 'cancelado'].includes(pedido.status?.toLowerCase())
            );

            // Mostrar pedidos ativos
            if (pedidosAtivos.length > 0) {
                elementos.pedidosAtivosContainer.style.display = 'block';
                elementos.pedidosAtivosList.innerHTML = pedidosAtivos.map(pedido => 
                    criarCardPedidoAtivo(pedido)
                ).join('');
            } else {
                elementos.pedidosAtivosContainer.style.display = 'none';
            }

            // Mostrar últimos 4 pedidos finalizados
            const ultimosPedidos = pedidosFinalizados.slice(0, 4);
            elementos.listaUltimosPedidos.innerHTML = ultimosPedidos.map(pedido => 
                criarCardPedidoResumo(pedido)
            ).join('');

            // Mostrar botão "Ver Todos" se houver mais pedidos
            if (todosPedidos.length > 4) {
                elementos.btnVerTodosPedidos.style.display = 'block';
                elementos.btnVerTodosPedidos.innerHTML = `<i class="fas fa-list-ul"></i> Ver Todos os ${todosPedidos.length} Pedidos <i class="fas fa-chevron-right"></i>`;
            } else {
                elementos.btnVerTodosPedidos.style.display = 'none';
            }

            // Esconder mensagem de sem pedidos
            elementos.semPedidosMessage.style.display = 'none';
            elementos.historicoUltimosPedidos.style.display = 'block';

        } catch (error) {
            container.innerHTML = '<div style="text-align: center; color: #f44336; padding: 2rem;"><i class="fas fa-exclamation-triangle"></i> Erro ao carregar histórico.</div>';
            console.error('Erro ao carregar status do pedido:', error);
        }
    }

    /**
     * Cria card para pedido ativo
     */
    function criarCardPedidoAtivo(pedido) {
        const dataPedido = new Date(pedido.created_at).toLocaleDateString('pt-BR');
        const status = (pedido.status || 'novo').toLowerCase();
        const itemPrincipal = extrairItemPrincipal(pedido.observacoes);
        
        // Calcular progresso baseado no status
        const progresso = calcularProgresso(status);
        
        return `
            <div class="card-pedido-moderno ativo" onclick="window.AppRastreamento.abrirModalDetalhesPedido(${pedido.id})">
                <div class="pedido-header">
                    <div class="pedido-info">
                        <h4>Pedido <span class="pedido-numero">#${pedido.id}</span></h4>
                        <div class="pedido-data">${dataPedido}</div>
                    </div>
                    <div class="pedido-status status-${status}">
                        ${status.toUpperCase()}
                    </div>
                </div>
                
                <div class="pedido-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progresso.percentual}%"></div>
                    </div>
                    <div class="progress-steps">
                        <div class="progress-step ${progresso.etapa >= 1 ? 'active' : ''}">Recebido</div>
                        <div class="progress-step ${progresso.etapa >= 2 ? 'active' : ''}">Preparando</div>
                        <div class="progress-step ${progresso.etapa >= 3 ? 'active' : ''}">Pronto</div>
                        <div class="progress-step ${progresso.etapa >= 4 ? 'active' : ''}">Entregue</div>
                    </div>
                </div>
                
                <div class="pedido-detalhes">
                    <div class="pedido-itens">
                        <div class="item-principal">${itemPrincipal}</div>
                        <div class="item-detalhes">+ ${pedido.observacoes.split('\n').length - 1} itens</div>
                    </div>
                    <div class="pedido-total">${window.AppUI.formatarMoeda(pedido.total)}</div>
                </div>
            </div>
        `;
    }

    /**
     * Cria card resumido para histórico
     */
    function criarCardPedidoResumo(pedido) {
        const dataPedido = new Date(pedido.created_at).toLocaleDateString('pt-BR');
        const status = (pedido.status || 'entregue').toLowerCase();
        const itemPrincipal = extrairItemPrincipal(pedido.observacoes);
        
        return `
            <div class="card-pedido-resumo" onclick="window.AppRastreamento.abrirModalDetalhesPedido(${pedido.id})">
                <div class="pedido-resumo-header">
                    <div class="pedido-resumo-info">
                        <h5>Pedido #${pedido.id}</h5>
                        <div class="pedido-resumo-data">${dataPedido}</div>
                    </div>
                    <div class="pedido-resumo-status status-${status}">
                        ${status.toUpperCase()}
                    </div>
                </div>
                <div class="pedido-resumo-detalhes">
                    <div class="pedido-resumo-item">${itemPrincipal}</div>
                    <div class="pedido-resumo-total">${window.AppUI.formatarMoeda(pedido.total)}</div>
                </div>
            </div>
        `;
    }

    /**
     * Calcula o progresso do pedido baseado no status
     */
    function calcularProgresso(status) {
        const etapas = {
            'novo': { etapa: 1, percentual: 25 },
            'preparando': { etapa: 2, percentual: 50 },
            'pronto': { etapa: 3, percentual: 75 },
            'entregue': { etapa: 4, percentual: 100 },
            'cancelado': { etapa: 0, percentual: 0 }
        };
        
        return etapas[status.toLowerCase()] || { etapa: 1, percentual: 25 };
    }

    /**
     * Extrai o item principal das observações do pedido
     */
    function extrairItemPrincipal(observacoes) {
        const obsLines = observacoes.split('\n');
        let isItemList = false;

        for (const line of obsLines) {
            if (line.includes('Itens:')) {
                isItemList = true;
                continue;
            }
            if (isItemList && line.trim().startsWith('*')) {
                return line.replace('*', '').trim().split('(')[0].substring(0, 30) + 
                       (line.length > 30 ? '...' : '');
            }
            if (line.includes('Subtotal:')) break;
        }
        
        return 'Detalhes do pedido';
    }

    /**
     * Abre o modal com todos os pedidos
     */
    function abrirModalTodosPedidos() {
        const pedidos = window.app.todosPedidosCliente;

        if (pedidos.length === 0) {
            window.AppUI.mostrarMensagem('Nenhum pedido encontrado.', 'warning');
            return;
        }

        const elementos = window.AppUI.elementos;
        
        elementos.detalhesModalTitulo.innerHTML = `
            <div class="todos-pedidos-header">
                <h3><i class="fas fa-list-ul"></i> Todos os Pedidos</h3>
                <div class="todos-pedidos-count">${pedidos.length} pedidos realizados</div>
            </div>
        `;
        
        elementos.detalhesPedidoContent.innerHTML = `
            <div class="todos-pedidos-list">
                ${pedidos.map(pedido => criarCardPedidoCompleto(pedido)).join('')}
            </div>
        `;
        
        elementos.modalDetalhesPedido.style.display = 'flex';
    }

    /**
     * Cria card completo para o modal de todos os pedidos
     */
    function criarCardPedidoCompleto(pedido) {
        const dataPedido = new Date(pedido.created_at).toLocaleString('pt-BR');
        const status = (pedido.status || 'novo').toLowerCase();
        const itemPrincipal = extrairItemPrincipal(pedido.observacoes);
        
        return `
            <div class="card-pedido-moderno ${status === 'entregue' ? 'entregue' : 'ativo'}" 
                 onclick="window.AppRastreamento.abrirModalDetalhesPedido(${pedido.id})">
                <div class="pedido-header">
                    <div class="pedido-info">
                        <h4>Pedido <span class="pedido-numero">#${pedido.id}</span></h4>
                        <div class="pedido-data">${dataPedido}</div>
                    </div>
                    <div class="pedido-status status-${status}">
                        ${status.toUpperCase()}
                    </div>
                </div>
                
                <div class="pedido-detalhes">
                    <div class="pedido-itens">
                        <div class="item-principal">${itemPrincipal}</div>
                        <div class="item-detalhes">Total: ${window.AppUI.formatarMoeda(pedido.total)}</div>
                    </div>
                    <div class="pedido-total">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Abre o modal com os detalhes de um pedido do histórico.
     */
    function abrirModalDetalhesPedido(pedidoId) {
        // Agora busca em window.app.todosPedidosCliente para garantir que funcione para todos
        const pedido = window.app.todosPedidosCliente.find(p => p.id.toString() === pedidoId.toString()); 
        if (!pedido) {
            window.AppUI.mostrarMensagem('Detalhes do pedido não encontrados.', 'error');
            return;
        }

        const dataPedido = new Date(pedido.created_at).toLocaleString('pt-BR');
        const status = (pedido.status || 'novo').toUpperCase();
        
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
        
        const elementos = window.AppUI.elementos;
        elementos.detalhesPedidoId.textContent = `#${pedido.id}`;
        
        // Lógica de cancelamento (só permite cancelar se status for NOVO ou PREPARANDO)
        const statusParaCancelamento = ['NOVO', 'PREPARANDO', 'EM ABERTO', 'NOVO (ADMIN)']; // Inclui variações de 'novo' e 'em aberto'
        const podeCancelar = statusParaCancelamento.includes(status);
        
        const cancelBtnHtml = podeCancelar
            ? `<button id="btn-cancelar-pedido-cliente" data-id="${pedido.id}" class="btn-login-app" style="background: var(--error-color, #f44336); margin-top: 15px;">
                 <i class="fas fa-trash-alt"></i> Cancelar Pedido
               </button>`
            : `<p style="margin-top: 15px; font-size: 0.9rem; color: #999;">O pedido não pode mais ser cancelado. Status atual: ${status}.</p>`;

        // Previsão de entrega
        const tempoEntregaMinutos = window.app.configLoja.tempo_entrega || 60;
        const criadoEm = new Date(pedido.created_at);
        const dataPrevisao = new Date(criadoEm.getTime() + tempoEntregaMinutos * 60000);
        const horaPrevisao = dataPrevisao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const statusAtivo = ['NOVO', 'PREPARANDO', 'PRONTO'];
        const previsaoText = statusAtivo.includes(status)
            ? `<p style="font-size: 0.9rem; margin: 5px 0;"><strong>Previsão de Entrega:</strong> <span style="color: var(--warning-color); font-weight: bold;">${horaPrevisao}</span></p>`
            : '';

        elementos.detalhesPedidoContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px;">
                <h4 style="margin: 0; font-size: 1.5rem;">${window.AppUI.formatarMoeda(pedido.total)}</h4>
                <span class="status-badge-history status-${status}">
                    <i class="fas fa-info-circle"></i> STATUS: ${status}
                </span>
            </div>
            
            ${previsaoText}
            
            <h5 style="border-bottom: 1px dashed #eee; padding-bottom: 5px; margin-top: 15px; font-weight: bold;">Detalhes da Entrega</h5>
            <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Data/Hora:</strong> ${dataPedido}</p>
            <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Cliente:</strong> ${pedido.nome_cliente}</p>
            <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Endereço:</strong> ${pedido.endereco_entrega}</p>
            <p style="margin: 5px 0; font-size: 0.9rem;"><strong>Pagamento:</strong> ${pedido.forma_pagamento}</p>
            
            <h5 style="border-bottom: 1px dashed #eee; padding-bottom: 5px; margin-top: 15px; font-weight: bold;">Itens Solicitados</h5>
            <div style="max-height: 150px; overflow-y: auto;">
                 ${itensListHtml || '<p style="font-size: 0.9rem; color: #999;">Nenhum item detalhado.</p>'}
            </div>
            
            ${cleanedObsAdicionais ? 
                `<h5 style="border-bottom: 1px dashed #eee; padding-bottom: 5px; margin-top: 15px; font-weight: bold;">Observações</h5>
                 <pre style="white-space: pre-wrap; font-size: 0.85rem; color: #555; background: #f9f9f9; padding: 10px; border-radius: 5px;">${cleanedObsAdicionais}</pre>` 
                : ''}
            
            ${cancelBtnHtml}
        `;
        elementos.modalDetalhesPedido.style.display = 'flex';
        
        if (podeCancelar) {
             const novoBtn = document.getElementById('btn-cancelar-pedido-cliente');
             if (novoBtn) {
                 novoBtn.addEventListener('click', () => {
                     cancelarPedidoCliente(pedido.id);
                 });
             }
        }
    }
    
    /**
     * Função para o cliente solicitar o cancelamento de um pedido.
     */
    async function cancelarPedidoCliente(pedidoId) {
        if (!confirm(`Tem certeza que deseja CANCELAR o Pedido #${pedidoId}? \n\nIsto pode não ser possível se o pedido já estiver pronto ou a caminho.`)) {
            return;
        }

        try {
            // A API de cancelamento deve verificar se o status permite o cancelamento (NOVO ou PREPARANDO)
            const sucesso = await window.AppAPI.cancelarPedidoNoSupabase(pedidoId);

            if (sucesso) {
                 window.AppUI.mostrarMensagem(`Pedido #${pedidoId} cancelado!`, 'success');
            } else {
                 // Se o pedido não foi cancelado (status avançado)
                 window.AppUI.mostrarMensagem(`O pedido #${pedidoId} não pode mais ser cancelado. Por favor, contate a loja.`, 'warning');
            }
            
            window.AppUI.fecharModal(window.AppUI.elementos.modalDetalhesPedido);
            
            // Força a atualização do histórico e rastreador
            carregarStatusUltimoPedido(); 
            if (window.app.pedidoAtivoId == pedidoId) {
                 window.app.Rastreamento.iniciarRastreamento(pedidoId);
            }

        } catch (error) {
            console.error("Erro ao cancelar pedido:", error);
            window.AppUI.mostrarMensagem('Erro ao tentar cancelar o pedido.', 'error');
        }
    }

    // Adiciona event listener para o botão "Ver Todos"
    document.addEventListener('DOMContentLoaded', function() {
        const btnVerTodos = document.getElementById('btn-ver-todos-pedidos');
        if (btnVerTodos) {
            btnVerTodos.addEventListener('click', abrirModalTodosPedidos);
        }
    });

    // Expõe as funções para o objeto global AppRastreamento
    window.AppRastreamento = {
        iniciarRastreamento,
        pararRastreamento,
        atualizarTrackerUI,
        carregarStatusUltimoPedido,
        abrirModalDetalhesPedido,
        abrirModalTodosPedidos,
        cancelarPedidoCliente
    };

})();