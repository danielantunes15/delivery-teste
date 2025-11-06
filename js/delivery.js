// js/delivery.js - Lógica do Painel de Pedidos Online
document.addEventListener('DOMContentLoaded', async function () {

    // --- VARIÁVEIS GLOBAIS ---
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('delivery-board');
    const acessoNegadoElement = document.getElementById('acesso-negado');
    const recarregarBtn = document.getElementById('recarregar-pedidos');
    
    const modalDetalhes = document.getElementById('modal-detalhes');
    const detalhesContent = document.getElementById('detalhes-pedido-content');
    const modalPedidoId = document.getElementById('modal-pedido-id');
    const btnAvancarStatus = document.getElementById('btn-avancar-status');
    const btnCancelarPedido = document.getElementById('btn-cancelar-pedido');

    let todosPedidos = [];
    let pedidoSelecionado = null;
    
    const STATUS_MAP = {
        'novo': { title: 'Novo', icon: 'fas fa-box-open', next: 'preparando', nextText: 'Iniciar Preparo', color: 'var(--primary-color)' },
        'preparando': { title: 'Preparando', icon: 'fas fa-fire-alt', next: 'pronto', nextText: 'Marcar como Pronto', color: 'var(--warning-color)' },
        'pronto': { title: 'Pronto para Envio', icon: 'fas fa-truck-loading', next: 'entregue', nextText: 'Marcar como Entregue', color: 'var(--info-color)' },
        'entregue': { title: 'Entregue/Finalizado', icon: 'fas fa-check-circle', next: null, nextText: 'Finalizado', color: 'var(--success-color)' },
        'cancelado': { title: 'Cancelado', icon: 'fas fa-times-circle', next: null, nextText: 'Cancelado', color: 'var(--error-color)' }
    };
    
    const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

    const mostrarMensagem = (mensagem, tipo = 'success') => {
        const container = document.getElementById('alert-container');
        if (!container) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${tipo}`; 
        alertDiv.innerHTML = `<span>${mensagem}</span><button class="alert-close" onclick="this.parentElement.remove()">&times;</button>`;
        container.appendChild(alertDiv);
        setTimeout(() => { if (alertDiv.parentNode) alertDiv.remove(); }, 5000);
    };
    
    const formatarFormaPagamento = (forma) => {
        const formas = {
            'dinheiro': 'Dinheiro',
            'cartao_(maquininha)': 'Cartão',
            'pix': 'PIX',
            'cartao_debito': 'Cartão Débito',
            'cartao_credito': 'Cartão Crédito',
            'crediario': 'Crediário'
        };
        return formas[forma] || forma;
    };
    
    // =================================================================
    // === CORREÇÃO CRÍTICA DO JAVASCRIPT ===
    // =================================================================
    const toggleDisplay = (element, show) => { 
        if (!element) return;
        // O painel principal (#delivery-board) usa 'flex', não 'block'
        if (element.id === 'delivery-board') {
            // AQUI ESTÁ A MUDANÇA: 'flex' no lugar de 'block'
            element.style.display = show ? 'flex' : 'none';
        } else {
            // Mantém o comportamento padrão para outros elementos
            element.style.display = show ? 'block' : 'none'; 
        }
    };
    // =================================================================
    // === FIM DA CORREÇÃO ===
    // =================================================================


    // --- AUTENTICAÇÃO E INICIALIZAÇÃO ---
    if (!window.sistemaAuth?.verificarAutenticacao()) {
        window.location.href = 'login.html';
        return;
    }
    const usuario = window.sistemaAuth.usuarioLogado;
    const isAdminOrManager = ['administrador', 'admin', 'gerente', 'supervisor'].includes(usuario.tipo?.toLowerCase());
    
    async function inicializar() {
        toggleDisplay(loadingElement, true);

        if (!isAdminOrManager) {
            toggleDisplay(loadingElement, false);
            toggleDisplay(acessoNegadoElement, true);
            return;
        }

        configurarEventListeners();
        await carregarPedidosOnline();

        toggleDisplay(loadingElement, false);
        toggleDisplay(contentElement, true); // Agora vai aplicar 'display: flex'
    }
    
    function configurarEventListeners() {
        if (recarregarBtn) {
            recarregarBtn.addEventListener('click', carregarPedidosOnline);
        }
        if (btnAvancarStatus) {
            btnAvancarStatus.addEventListener('click', avancarStatusPedido);
        }
        if (btnCancelarPedido) {
            btnCancelarPedido.addEventListener('click', () => atualizarStatusPedido('cancelado', 'Tem certeza que deseja CANCELAR este pedido?'));
        }
    }
    
    // ----------------------------------------------------------------------
    // --- LÓGICA DE PEDIDOS ONLINE (CRUD) ---
    // ----------------------------------------------------------------------

    async function carregarPedidosOnline() {
        if (!contentElement) return;

        const board = document.getElementById('delivery-board');
        board.querySelectorAll('.card-list').forEach(list => list.innerHTML = '');
        
        try {
            // Assume filtro por data de hoje
            const { data, error } = await supabase.from('pedidos_online')
                .select('*')
                .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z') 
                .order('created_at', { ascending: true });

            if (error) throw error;
            
            todosPedidos = data || [];
            exibirPedidosNoBoard(todosPedidos);
            
        } catch (error) {
            console.error('❌ Erro ao carregar pedidos online:', error);
            mostrarMensagem('Erro ao carregar o painel de pedidos. Verifique se a tabela `pedidos_online` existe.', 'error');
        }
    }

    function exibirPedidosNoBoard(pedidos) {
        // Inicializa colunas para todos os status (incluindo cancelado, para visualização)
        const colunas = { novo: [], preparando: [], pronto: [], entregue: [], cancelado: [] };
        
        pedidos.forEach(p => {
            const status = p.status || 'novo';
            if (colunas[status]) {
                colunas[status].push(p);
            }
        });
        
        Object.keys(STATUS_MAP).forEach(status => {
            const colElement = document.getElementById(`col-${status}`);
            if (!colElement) return;
            const listElement = colElement.querySelector('.card-list');
            
            colElement.querySelector('h3').innerHTML = `<i class="${STATUS_MAP[status].icon}"></i> ${STATUS_MAP[status].title} (${colunas[status].length})`;
            listElement.innerHTML = '';
            
            if (colunas[status].length === 0) {
                 listElement.innerHTML = `<p style="text-align: center; color: white; font-style: italic; margin-top: 1rem; opacity: 0.8;">Nenhum pedido</p>`;
            } else {
                colunas[status].forEach(pedido => {
                    const card = criarCardPedido(pedido);
                    listElement.appendChild(card);
                });
            }
        });
    }

    // ================================================================
    // === INÍCIO DA ALTERAÇÃO (Card do Pedido Compacto) ===
    // ================================================================
    
    /**
     * Extrai a informação de troco da string de observações.
     * @param {string} observacoes - A string completa de observações.
     * @returns {string} - A informação de troco formatada.
     */
    function parseTroco(observacoes) {
        if (!observacoes) return 'Não precisa';

        const trocoMatch = observacoes.match(/TROCO NECESSÁRIO: Sim, para (R\$ \d+[,.]\d{2})/);
        if (trocoMatch && trocoMatch[1]) {
            return `Troco p/ ${trocoMatch[1]}`;
        }
        
        if (observacoes.includes('TROCO NECESSÁRIO: Não')) {
            return 'Não precisa';
        }
        
        // Se a informação de troco não estiver formatada (pedidos antigos)
        return 'Verificar';
    }

    /**
     * Extrai a lista de itens da string de observações.
     * @param {string} observacoes - A string completa de observações.
     * @returns {string} - A lista de itens formatada.
     */
    function parseItens(observacoes) {
        if (!observacoes) return 'Nenhum item listado.';

        const linhas = observacoes.split('\n');
        let itens = [];
        let capturandoItens = false;

        for (const linha of linhas) {
            if (linha.startsWith('Itens:')) {
                capturandoItens = true;
                continue; // Pula a linha "Itens:"
            }
            if (linha.startsWith('Total:') || linha.startsWith('OBSERVAÇÕES ADICIONAIS:')) {
                capturandoItens = false;
                break; // Para de capturar ao encontrar o total ou obs
            }
            if (capturandoItens && linha.trim() !== '') {
                // Remove o "*" e espaços extras
                itens.push(linha.replace('*', '').trim()); 
            }
        }
        if (itens.length === 0) return 'Detalhes no modal.';
        return itens.join('<br>'); // Retorna os itens com quebra de linha HTML
    }

    /**
     * Extrai as observações adicionais do cliente.
     * @param {string} observacoes - A string completa de observações.
     * @returns {string} - Apenas as observações adicionais.
     */
    function parseObsAdicionais(observacoes) {
        if (!observacoes) return '';
        const obsSeparada = observacoes.split('OBSERVAÇÕES ADICIONAIS:');
        if (obsSeparada.length > 1) {
            return obsSeparada[1].trim();
        }
        return '';
    }

    function criarCardPedido(pedido) {
        const card = document.createElement('div');
        const status = pedido.status || 'novo';
        // Usa a classe .pedido-card existente, que já tem o fundo branco
        card.className = `pedido-card status-${status}`;
        card.setAttribute('data-id', pedido.id);
        
        const hora = new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // Extrai as informações necessárias
        const trocoInfo = parseTroco(pedido.observacoes);
        const pagamentoInfo = formatarFormaPagamento(pedido.forma_pagamento);
        const totalInfo = formatarMoeda(pedido.total);

        // O card inteiro é clicável para abrir o modal
        card.innerHTML = `
            <div class="card-novo-header">
                <strong>Pedido #${pedido.id}</strong>
                <span class="card-novo-hora"><i class="fas fa-clock"></i> ${hora}</span>
            </div>
            <div class="card-novo-body">
                <div class="card-novo-cliente">
                    <span class="cliente-nome">
                        <i class="fas fa-user"></i>
                        ${pedido.nome_cliente}
                    </span>
                    <span class="cliente-fone">
                        <i class="fas fa-phone"></i>
                        ${pedido.telefone_cliente}
                    </span>
                </div>
                <div class="card-novo-info">
                    <div class="info-pagamento">
                        <span>Total</span>
                        <strong>${totalInfo}</strong>
                    </div>
                    <div class="info-pagamento">
                        <span>${pagamentoInfo}</span>
                        <strong class="troco-info">${trocoInfo}</strong>
                    </div>
                </div>
                <div class="card-novo-delivery">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${pedido.endereco_entrega}</span>
                </div>
            </div>
            <div class="card-novo-action">
                <button class="btn-ver-detalhes">
                    Ver Detalhes &nbsp; <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
        
        card.addEventListener('click', () => abrirModalDetalhes(pedido.id));
        return card;
    }
    // ================================================================
    // === FIM DA ALTERAÇÃO ===
    // ================================================================
    
    window.abrirModalDetalhes = function(pedidoId) {
        pedidoSelecionado = todosPedidos.find(p => p.id === pedidoId);
        if (!pedidoSelecionado) return;
        
        modalPedidoId.textContent = `#${pedidoId}`;
        
        const statusInfo = STATUS_MAP[pedidoSelecionado.status];
        
        // Configura o botão de avançar
        btnAvancarStatus.style.display = statusInfo.next ? 'inline-flex' : 'none';
        btnAvancarStatus.textContent = statusInfo.nextText || '';
        btnAvancarStatus.setAttribute('data-next-status', statusInfo.next);
        
        // Esconde botões se o pedido estiver em status final
        btnCancelarPedido.style.display = pedidoSelecionado.status !== 'cancelado' && pedidoSelecionado.status !== 'entregue' ? 'inline-flex' : 'none';
        btnAvancarStatus.style.display = pedidoSelecionado.status !== 'cancelado' && pedidoSelecionado.status !== 'entregue' ? btnAvancarStatus.style.display : 'none';
        
        // Se for o último status, forçar o botão a ser azul
        btnAvancarStatus.style.background = STATUS_MAP[statusInfo.next]?.color || 'var(--primary-color)';
        
        // ================================================================
        // === INÍCIO DA ALTERAÇÃO (Exibição no Modal) ===
        // ================================================================
        // Separa Observações Adicionais dos Itens
        const todosItens = parseItens(pedidoSelecionado.observacoes).replace(/\n/g, '<br>'); // Pega itens formatados
        const obsAdicionais = parseObsAdicionais(pedidoSelecionado.observacoes);

        detalhesContent.innerHTML = `
            <p><strong>Status Atual:</strong> <span style="font-weight: bold; color: ${statusInfo.color}">${statusInfo.title}</span></p>
            <p><strong>Cliente:</strong> ${pedidoSelecionado.nome_cliente}</p>
            <p><strong>Telefone:</strong> <a href="https://wa.me/55${pedidoSelecionado.telefone_cliente.replace(/\D/g,'')}" target="_blank">${pedidoSelecionado.telefone_cliente}</a></p>
            <p><strong>Endereço:</strong> ${pedidoSelecionado.endereco_entrega}</p>
            <p><strong>Pagamento:</strong> ${formatarFormaPagamento(pedidoSelecionado.forma_pagamento)}</p>
            <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary-dark); margin-top: 1rem;">Total: ${formatarMoeda(pedidoSelecionado.total)}</p>
            
            <h4 style="margin-top: 1.5rem; border-top: 1px dashed #ccc; padding-top: 0.5rem;">Itens do Pedido:</h4>
            <div style="font-size: 0.9rem; font-family: inherit; background: #f9f9f9; padding: 10px; border-radius: 5px; max-height: 150px; overflow-y: auto;">${todosItens}</div>

            ${obsAdicionais ? `
                <h4 style="margin-top: 1.5rem;">Observações Adicionais:</h4>
                <p style="font-size: 0.9rem; font-style: italic; background: #fff8e1; padding: 10px; border-radius: 5px;">${obsAdicionais}</p>
            ` : ''}
        `;
        // ================================================================
        // === FIM DA ALTERAÇÃO ===
        // ================================================================
        
        modalDetalhes.style.display = 'flex';
    }
    
    async function avancarStatusPedido() {
        const nextStatus = btnAvancarStatus.getAttribute('data-next-status');
        if (!nextStatus) return;
        await atualizarStatusPedido(nextStatus, `Confirma a mudança de status para "${STATUS_MAP[nextStatus].title}"?`);
    }

    async function atualizarStatusPedido(novoStatus, mensagemConfirmacao) {
        if (!pedidoSelecionado || !confirm(mensagemConfirmacao)) return;
        
        try {
            const { error } = await supabase.from('pedidos_online')
                .update({ status: novoStatus })
                .eq('id', pedidoSelecionado.id);
            
            if (error) throw error;

            mostrarMensagem(`Status do pedido #${pedidoSelecionado.id} atualizado para "${STATUS_MAP[novoStatus].title}"!`, 'success');
            
            modalDetalhes.style.display = 'none';
            await carregarPedidosOnline();

        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
            mostrarMensagem('Erro ao atualizar status: ' + error.message, 'error');
        }
    }


    inicializar();
});