// js/delivery.js - Lógica do Painel de Pedidos Online
document.addEventListener('DOMContentLoaded', async function () {

    // --- VARIÁVEIS GLOBAIS ---
    const loadingElement = document.getElementById('loading');
    const contentElement = document.getElementById('delivery-board');
    const acessoNegadoElement = document.getElementById('acesso-negado');
    const recarregarBtn = document.getElementById('recarregar-pedidos');
    
    // Modal de Detalhes do Pedido
    const modalDetalhes = document.getElementById('modal-detalhes');
    const detalhesContent = document.getElementById('detalhes-pedido-content');
    const modalPedidoId = document.getElementById('modal-pedido-id');
    const btnAvancarStatus = document.getElementById('btn-avancar-status');
    const btnCancelarPedido = document.getElementById('btn-cancelar-pedido');
    
    // ==================================
    // === NOVO ELEMENTO (IMPRIMIR) ===
    // ==================================
    const btnImprimirCanhoto = document.getElementById('btn-imprimir-canhoto');
    // ==================================

    // Elementos de Configurações
    const btnAbrirConfig = document.getElementById('btn-abrir-config');
    const modalConfig = document.getElementById('modal-configuracoes');
    const formConfig = document.getElementById('form-config-delivery');
    const btnFecharConfig = document.getElementById('fechar-modal-config');

    let todosPedidos = [];
    let pedidoSelecionado = null;
    
    // Cache de configurações da loja
    let configLoja = { tempo_entrega: 60 }; // Padrão de 60 minutos
    let timerInterval = null;
    let supabaseChannel = null;
    const audioNotificacao = new Audio("data:audio/mpeg;base64,SUQzBAAAAAAB9AAAAAoAAABPAYBAYbQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4bQhf4LIQkACgAAAABAAAD/8AADCgAAAABYQU1BAUBAQBAAAAP/AAD/8AAMDgAAAABYQU1BAUBAQBAAAAP/AAD/8AAMEAAAAABYQU1BAUBAQBAAAAP/AAD/8AAMFAAAAABYQU1BAUBAQBAAAAP/AAD/8AAKicgAADEBCAcHAQEBAYGBgYGCAgJCAkJCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCv/8AADCgECAwMFBQQGBgcHCAgJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCv/8AADCgECAwMFBQQGBgcHCAgJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCv/wAAv/8AADCgECAwMFBQQGBgcHCAgJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCv/8AADCgECAwMFBQQGBgcHCAgJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCv/8AADCgECAwMFBQQGBgcHCAgJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCvEt");
    
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
    
    const toggleDisplay = (element, show) => { 
        if (!element) return;
        if (element.id === 'delivery-board') {
            element.style.display = show ? 'flex' : 'none';
        } else {
            element.style.display = show ? 'block' : 'none'; 
        }
    };


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
        
        // Carrega as configurações primeiro
        await carregarConfiguracoesDaLoja(); 
        
        // Depois carrega os pedidos
        await carregarPedidosOnline();
        
        // Inicia o ouvinte de novos pedidos (Realtime)
        iniciarOuvinteDePedidos();
        
        // Inicia o relógio que atualiza os timers de atraso
        iniciarAtualizadorDeTimers();

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

        // ==================================
        // === NOVO LISTENER (IMPRIMIR) ===
        // ==================================
        if (btnImprimirCanhoto) {
            btnImprimirCanhoto.addEventListener('click', imprimirCanhotoDelivery);
        }
        // ==================================

        // Listeners do Modal de Configurações
        if (btnAbrirConfig) {
            btnAbrirConfig.addEventListener('click', abrirModalConfiguracoes);
        }
        if (btnFecharConfig) {
            btnFecharConfig.addEventListener('click', fecharModalConfiguracoes);
        }
        if (formConfig) {
            formConfig.addEventListener('submit', salvarConfiguracoes);
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
            // Pega pedidos de hoje que NÃO ESTÃO entregues ou cancelados
            const { data, error } = await supabase.from('pedidos_online')
                .select('*')
                .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00Z')
                .neq('status', 'entregue') // Não carrega entregues
                .neq('status', 'cancelado') // Não carrega cancelados
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
        // Inicializa colunas
        const colunas = { novo: [], preparando: [], pronto: [], entregue: [], cancelado: [] };
        
        // Filtra apenas pedidos não finalizados para o board principal
        const pedidosAtivos = pedidos.filter(p => p.status !== 'entregue' && p.status !== 'cancelado');
        
        pedidosAtivos.forEach(p => {
            const status = p.status || 'novo';
            if (colunas[status]) {
                colunas[status].push(p);
            }
        });
        
        // Atualiza apenas as colunas ativas (Novo, Preparando, Pronto)
        ['novo', 'preparando', 'pronto'].forEach(status => {
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

        // Atualiza os timers imediatamente após exibir
        atualizarTimers();
    }
    
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
    function parseItens(observacoes, formatAsHtml = false) {
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
        
        // Retorna com quebra de linha HTML ou de texto
        return formatAsHtml ? itens.join('<br>') : itens.join('\n');
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

    // ================================================================
    // === INÍCIO DA ALTERAÇÃO (Adicionar Hora Original ao Card) ===
    // ================================================================
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
                <div class="card-novo-hora-grupo">
                    <span class="card-novo-hora"><i class="fas fa-clock"></i> ${hora}</span>
                    <span class="card-novo-timer no-prazo" id="timer-pedido-${pedido.id}">
                        (Carregando...)
                    </span>
                </div>
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
        
        // Separa Observações Adicionais dos Itens
        const todosItens = parseItens(pedidoSelecionado.observacoes, true); // true = formatar como HTML
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
            
            // ==================================
            // === ATUALIZAÇÃO REALTIME ===
            // ==================================
            // Em vez de recarregar tudo, apenas move o card localmente
            // Isso é mais rápido e funciona com o Realtime
            const pedidoAtualizado = todosPedidos.find(p => p.id === pedidoSelecionado.id);
            if(pedidoAtualizado) {
                pedidoAtualizado.status = novoStatus;
            }
            // Se o status for final, remove o pedido da lista ativa
            if (novoStatus === 'entregue' || novoStatus === 'cancelado') {
                todosPedidos = todosPedidos.filter(p => p.id !== pedidoSelecionado.id);
            }
            exibirPedidosNoBoard(todosPedidos);
            // ==================================

        } catch (error) {
            console.error('❌ Erro ao atualizar status:', error);
            mostrarMensagem('Erro ao atualizar status: ' + error.message, 'error');
        }
    }

    // ==================================
    // === NOVAS FUNÇÕES (CONFIGURAÇÕES) ===
    // ==================================
    
    async function carregarConfiguracoesDaLoja() {
        try {
            const { data, error } = await supabase
                .from('config_loja')
                .select('*')
                .eq('id', 1) // Pega a linha de configuração (ID 1)
                .single();
            
            if (error) {
                 if (error.code === 'PGRST116') { // Nenhum registro encontrado
                    console.warn('Nenhuma configuração de loja encontrada. Usando padrões.');
                    // configLoja já tem o padrão de 60 minutos
                 } else {
                    throw error;
                 }
            }
            
            if (data) {
                // Salva a configuração globalmente
                configLoja = data; 
                console.log('Configurações da loja carregadas:', configLoja);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar configurações da loja:', error);
            mostrarMensagem('Não foi possível carregar as config. da loja. Usando tempo padrão (60min).', 'error');
        }
    }

    function fecharModalConfiguracoes() {
        if (modalConfig) {
            modalConfig.style.display = 'none';
        }
    }

    async function abrirModalConfiguracoes() {
        if (!modalConfig) return;
        
        // Usa a configuração global já carregada (configLoja)
        // Isso evita uma chamada desnecessária ao banco toda vez que abre o modal
        const data = configLoja;
        
        // Preenche o formulário com os dados
        if (data) {
            document.getElementById('config-taxa-entrega').value = data.taxa_entrega || '';
            document.getElementById('config-tempo-entrega').value = data.tempo_entrega || '60';
            
            const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
            dias.forEach(dia => {
                document.getElementById(`${dia}-abertura`).value = data[`${dia}_abertura`] || '';
                document.getElementById(`${dia}-fechamento`).value = data[`${dia}_fechamento`] || '';
                document.getElementById(`${dia}-fechado`).checked = data[`${dia}_fechado`] || false;
            });
        }
            
        modalConfig.style.display = 'flex';
    }

    async function salvarConfiguracoes(e) {
        e.preventDefault();
        mostrarMensagem('Salvando...', 'info');

        try {
            const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
            const updateData = {
                id: 1, // Chave primária
                taxa_entrega: parseFloat(document.getElementById('config-taxa-entrega').value) || 0,
                tempo_entrega: parseInt(document.getElementById('config-tempo-entrega').value) || 60
            };

            dias.forEach(dia => {
                const abertura = document.getElementById(`${dia}-abertura`).value;
                const fechamento = document.getElementById(`${dia}-fechamento`).value;
                const fechado = document.getElementById(`${dia}-fechado`).checked;

                updateData[`${dia}_abertura`] = abertura || null;
                updateData[`${dia}_fechamento`] = fechamento || null;
                updateData[`${dia}_fechado`] = fechado;
            });

            // Usar 'upsert' é a forma mais segura
            const { error } = await supabase
                .from('config_loja')
                .upsert(updateData, { onConflict: 'id' });

            if (error) throw error;
            
            // Atualiza o cache global de configurações
            configLoja = updateData; 
            
            mostrarMensagem('Configurações salvas com sucesso!', 'success');
            fecharModalConfiguracoes();
            atualizarTimers(); // Atualiza os timers com o novo tempo

        } catch (error) {
            console.error('❌ Erro ao salvar configurações:', error);
            mostrarMensagem('Erro ao salvar configurações: ' + error.message, 'error');
        }
    }
    
    // ==================================
    // === NOVAS FUNÇÕES (REALTIME E TIMER) ===
    // ==================================

    function tocarNotificacao() {
        audioNotificacao.play().catch(e => console.warn("Não foi possível tocar o som de notificação:", e.message));
    }

    /**
     * Inicia o ouvinte de Realtime do Supabase.
     */
    function iniciarOuvinteDePedidos() {
        // Se já houver um canal, remove a inscrição antiga
        if (supabaseChannel) {
            supabase.removeChannel(supabaseChannel);
        }

        // Cria um novo canal
        supabaseChannel = supabase.channel('pedidos_online_insert')
            .on(
                'postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'pedidos_online' 
                }, 
                (payload) => {
                    console.log('Novo pedido recebido via Realtime!', payload.new);
                    
                    // Adiciona o novo pedido à lista global
                    todosPedidos.push(payload.new);
                    
                    // Re-desenha o board com o novo pedido
                    exibirPedidosNoBoard(todosPedidos);
                    
                    // Toca o som de notificação
                    tocarNotificacao();
                    
                    // Mostra uma mensagem
                    mostrarMensagem(`🔔 Novo Pedido #${payload.new.id} de ${payload.new.nome_cliente}!`, 'success');
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Ouvindo novos pedidos em tempo real!');
                }
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('❌ Erro no Realtime:', err);
                    mostrarMensagem('Erro na conexão em tempo real. Recarregue a página.', 'error');
                }
            });
    }

    /**
     * Inicia o intervalo que atualiza os timers dos cards.
     */
    function iniciarAtualizadorDeTimers() {
        // Limpa qualquer timer antigo
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Atualiza os timers a cada 15 segundos
        timerInterval = setInterval(atualizarTimers, 15000); 
        
        // Executa uma vez imediatamente
        atualizarTimers();
    }

    /**
     * Atualiza todos os timers visíveis no board.
     */
    function atualizarTimers() {
        const agora = new Date();
        const tempoEntregaPadrao = configLoja.tempo_entrega || 60; // Pega o tempo do cache

        // Itera por todos os pedidos na lista global
        todosPedidos.forEach(pedido => {
            const timerEl = document.getElementById(`timer-pedido-${pedido.id}`);
            
            // Se o card não estiver na tela, não faz nada
            if (!timerEl) return;
            
            // Se o pedido já foi finalizado, limpa o timer
            if (pedido.status === 'entregue' || pedido.status === 'cancelado') {
                timerEl.innerHTML = `<i class="fas fa-check"></i> Finalizado`;
                timerEl.className = 'card-novo-timer'; // Reseta classe
                return;
            }

            const criadoEm = new Date(pedido.created_at);
            const minutosPassados = (agora - criadoEm) / 60000; // Milissegundos para minutos
            
            const tempoRestante = tempoEntregaPadrao - minutosPassados;

            // ================================================================
            // === INÍCIO DA ALTERAÇÃO (Lógica do Timer de Atraso) ===
            // ================================================================
            if (tempoRestante <= 0) {
                // ATRASADO
                timerEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${Math.abs(tempoRestante).toFixed(0)} min ATRASADO`;
                timerEl.className = 'card-novo-timer atrasado';
            } else {
                // NO PRAZO
                timerEl.innerHTML = `${tempoRestante.toFixed(0)} min restantes`;
                timerEl.className = 'card-novo-timer no-prazo';
            }
            // ================================================================
            // === FIM DA ALTERAÇÃO ===
            // ================================================================
        });
    }
    
    // ==================================
    // === NOVA FUNÇÃO (IMPRIMIR CANHOTO) ===
    // ==================================
    function imprimirCanhotoDelivery() {
        if (!pedidoSelecionado) {
            mostrarMensagem('Nenhum pedido selecionado', 'error');
            return;
        }

        const pedido = pedidoSelecionado;
        const horaPedido = new Date(pedido.created_at).toLocaleString('pt-BR');
        const itens = parseItens(pedido.observacoes, false); // false = formatar como texto (com \n)
        const obsAdicionais = parseObsAdicionais(pedido.observacoes);
        const troco = parseTroco(pedido.observacoes);
        const pagamento = formatarFormaPagamento(pedido.forma_pagamento);

        // Estilo otimizado para impressoras térmicas (58mm)
        const thermalCss = `
            <style>
                body {
                    width: 58mm;
                    font-family: 'Arial', sans-serif;
                    font-size: 10px;
                    margin: 0;
                    padding: 5px;
                }
                h4 {
                    text-align: center;
                    margin: 2px 0;
                    font-size: 12px;
                }
                hr {
                    border: 0;
                    border-top: 1px dashed #000;
                    margin: 5px 0;
                }
                p {
                    margin: 2px 0;
                }
                .detalhes {
                    font-size: 9px;
                    white-space: pre-wrap; /* Mantém quebras de linha dos itens */
                    margin-bottom: 5px;
                }
                .total {
                    font-weight: bold;
                    font-size: 12px;
                    margin-top: 5px;
                }
                @page {
                    margin: 0;
                }
            </style>
        `;

        const canhotoContent = `
            <div id="canhoto-impressao">
                <h4>Confeitaria Doces Criativos</h4>
                <p><strong>Pedido:</strong> #${pedido.id}</p>
                <p><strong>Data/Hora:</strong> ${horaPedido}</p>
                <hr>
                <p><strong>Cliente:</strong> ${pedido.nome_cliente}</p>
                <p><strong>Telefone:</strong> ${pedido.telefone_cliente}</p>
                <p><strong>Endereço:</strong> ${pedido.endereco_entrega}</p>
                <hr>
                <p><strong>Itens do Pedido:</strong></p>
                <div class="detalhes">${itens}</div>
                <hr>
                ${obsAdicionais ? `<p><strong>Obs:</strong> ${obsAdicionais}</p><hr>` : ''}
                <p><strong>Pagamento:</strong> ${pagamento}</p>
                <p><strong>Troco:</strong> ${troco}</p>
                <p class="total"><strong>TOTAL: ${formatarMoeda(pedido.total)}</strong></p>
                <hr>
                <p style="text-align: center; font-size: 9px;">Obrigado pela preferência!</p>
            </div>`;

        const printWindow = window.open('', 'PrintCanhoto', 'height=600,width=400');
        
        printWindow.document.write('<html><head><title>Canhoto do Pedido</title>' + thermalCss + '</head><body>');
        printWindow.document.write(canhotoContent);
        
        // Script de impressão e fechamento
        const fixScript = `
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 1000); 
                };
            </script>
        `;
        printWindow.document.write(fixScript);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
    }
    
    // ==================================

    inicializar();
});