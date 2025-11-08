// js/ui.js - Módulo de Interface e DOM

(function() {
    
    // Objeto para armazenar todos os elementos do DOM
    const elementos = {
        // Views
        appContainer: document.getElementById('app-container'),
        authScreen: document.getElementById('auth-screen'),
        mobileNav: document.getElementById('mobile-bottom-nav'),
        views: document.querySelectorAll('.app-view'),
        navItems: document.querySelectorAll('.bottom-nav .nav-item'),
        
        // Alertas
        alertContainer: document.getElementById('alert-container'),
        
        // Auth
        authTelefoneInput: document.getElementById('auth-telefone'),
        btnIniciarSessao: document.getElementById('btn-iniciar-sessao'),
        cadastroForm: document.getElementById('cadastro-form'),
        cadastroTelefoneHidden: document.getElementById('cadastro-telefone-hidden'),
        cadastroNomeInput: document.getElementById('cadastro-nome'),
        cadastroCepInput: document.getElementById('cadastro-cep'),
        cadastroRuaInput: document.getElementById('cadastro-rua'),
        cadastroNumeroInput: document.getElementById('cadastro-numero'),
        cadastroBairroInput: document.getElementById('cadastro-bairro'),
        cadastroCidadeInput: document.getElementById('cadastro-cidade'),
        cadastroEstadoInput: document.getElementById('cadastro-estado'),
        btnFinalizarCadastro: document.getElementById('btn-finalizar-cadastro'),
        loginFormGroup: document.getElementById('login-form-group'),

        // Perfil (view-inicio)
        logoutBtnApp: document.getElementById('logout-btn-app'),
        homeClienteNome: document.getElementById('home-cliente-nome'),
        statusUltimoPedido: document.getElementById('status-ultimo-pedido'),
        homeEndereco: document.getElementById('home-endereco'),
        abrirModalEditarEndereco: document.getElementById('abrir-modal-editar-endereco'),

        // Rastreamento (view-inicio)
        rastreamentoContainer: document.getElementById('rastreamento-pedido-ativo'),
        rastreamentoPedidoId: document.getElementById('rastreamento-pedido-id'),
        rastreamentoStatusTexto: document.getElementById('rastreamento-status-texto'),
        stepNovo: document.getElementById('step-novo'),
        stepPreparando: document.getElementById('step-preparando'),
        stepPronto: document.getElementById('step-pronto'),
        stepEntregue: document.getElementById('step-entregue'),

        // Cardápio (view-cardapio)
        storeStatusIndicator: document.querySelector('.store-status .status-indicator'),
        storeStatusText: document.querySelector('.store-status .status-text'),
        storeHoursText: document.getElementById('store-hours-text'),
        storeAttentionBar: document.querySelector('.store-status .attention-bar'),
        storeClosedMessage: document.getElementById('store-closed-message'),
        categoriesScroll: document.getElementById('categorias-container'),
        popularScroll: document.getElementById('popular-scroll'),
        productsSection: document.getElementById('products-section'),
        searchIcon: document.querySelector('.header .search-icon'),
        shareIcon: document.querySelector('.header .share-icon'),

        // Carrinho (view-carrinho)
        carrinhoBadge: document.getElementById('carrinho-badge'),
        cartCountNav: document.querySelector('.bottom-nav .cart-count'),
        pedidoObservacoes: document.getElementById('pedido-observacoes'),
        trocoParaInput: document.getElementById('troco-para'),
        carrinhoItens: document.getElementById('carrinho-itens'),
        subtotalCarrinho: document.getElementById('subtotal-carrinho'),
        taxaEntregaCarrinho: document.getElementById('taxa-entrega-carrinho'),
        totalCarrinho: document.getElementById('total-carrinho'),
        finalizarDiretoBtn: document.getElementById('finalizar-pedido-direto'),
        carrinhoEnderecoDisplay: document.getElementById('carrinho-endereco-display'),
        carrinhoClienteNomeDisplay: document.getElementById('carrinho-cliente-nome'),
        carrinhoEnderecoInput: document.getElementById('carrinho-endereco-input'),
        opcoesPagamento: document.querySelectorAll('.opcoes-pagamento .pagamento-opcao'),

        // Modais
        modais: document.querySelectorAll('.modal'),
        modalEditarEndereco: document.getElementById('modal-editar-endereco'),
        formEditarEndereco: document.getElementById('form-editar-endereco'),
        modalCepInput: document.getElementById('modal-cep'),
        modalRuaInput: document.getElementById('modal-rua'),
        modalNumeroInput: document.getElementById('modal-numero'),
        modalBairroInput: document.getElementById('modal-bairro'),
        modalCidadeInput: document.getElementById('modal-cidade'),
        modalEstadoInput: document.getElementById('modal-estado'),
        
        modalDetalhesPedido: document.getElementById('modal-detalhes-pedido'),
        detalhesPedidoId: document.getElementById('detalhes-pedido-id'),
        detalhesPedidoContent: document.getElementById('detalhes-pedido-content'),

        modalOpcoesProduto: document.getElementById('modal-opcoes-produto'),
        opcoesTitulo: document.getElementById('opcoes-titulo'),
        opcoesDescricao: document.getElementById('opcoes-descricao'),
        opcoesContainer: document.getElementById('opcoes-container'),
        complementosContainer: document.getElementById('complementos-container'),
        opcoesObservacao: document.getElementById('opcoes-observacao'),
        opcoesBtnRemover: document.getElementById('opcoes-btn-remover'),
        opcoesQuantidadeValor: document.getElementById('opcoes-quantidade-valor'),
        opcoesBtnAdicionar: document.getElementById('opcoes-btn-adicionar'),
        opcoesPrecoModal: document.getElementById('opcoes-preco-modal'),
        btnAdicionarOpcoes: document.getElementById('btn-adicionar-opcoes'),
    };

    /**
     * Exibe uma mensagem de alerta no topo da tela.
     * @param {string} mensagem - O texto a ser exibido.
     * @param {string} [tipo='info'] - O tipo de alerta ('info', 'success', 'warning', 'error').
     */
    function mostrarMensagem(mensagem, tipo = 'info') {
        const alertContainer = elementos.alertContainer;
        if (!alertContainer) return;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${tipo}`;
        alertDiv.innerHTML = `<span>${mensagem}</span><button class="alert-close" onclick="this.parentElement.remove()">&times;</button>`;
        alertContainer.appendChild(alertDiv);
        setTimeout(() => { if (alertDiv.parentNode) alertDiv.remove(); }, 5000);
    }

    /**
     * Alterna a visualização das "páginas" do app.
     * @param {string} viewId - O ID da view a ser mostrada (ex: 'view-cardapio').
     */
    function alternarView(viewId) {
        // Guarda de Rota
        if ((viewId === 'view-inicio' || viewId === 'view-carrinho') && !window.app.clienteLogado) {
            mostrarMensagem('Você precisa fazer login para acessar esta área.', 'info');
            viewId = 'auth-screen';
        }
        
        elementos.views.forEach(view => {
            if (view) view.classList.remove('active');
        });
        
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
        } else {
             console.error(`❌ ERRO: View com ID "${viewId}" não encontrada.`);
        }
        
        // Sincroniza o menu novo (bottom-nav)
        elementos.navItems.forEach(item => {
             item.classList.toggle('active', item.getAttribute('data-view') === viewId);
        });
        
        if (viewId === 'view-carrinho') {
            window.app.Carrinho.atualizarCarrinhoDisplay();
        }
    }

    /**
     * Abre o modal de edição de endereço e preenche com dados do perfil.
     */
    function abrirModalEditarEndereco() {
        if (!window.app.clienteLogado) {
             alternarView('auth-screen');
             mostrarMensagem('Faça login para editar seu endereço.', 'error');
             return;
        }
        const perfil = window.app.clientePerfil;
        const cepMatch = perfil.endereco ? perfil.endereco.match(/\(CEP:\s?(\d{5}-?\d{3})\)/) : null;
        
        elementos.modalCepInput.value = cepMatch ? cepMatch[1] : '';
        elementos.modalRuaInput.value = '';
        elementos.modalNumeroInput.value = '';
        elementos.modalBairroInput.value = '';
        elementos.modalCidadeInput.value = '';
        elementos.modalEstadoInput.value = '';
        
        elementos.modalEditarEndereco.style.display = 'flex';
    }
    
    /**
     * Fecha um modal específico.
     * @param {HTMLElement} modalElement - O elemento do modal a ser fechado.
     */
    function fecharModal(modalElement) {
        if(modalElement) {
            modalElement.style.display = 'none';
        }
    }

    // Expõe os elementos e funções para o objeto global AppUI
    window.AppUI = {
        elementos,
        mostrarMensagem,
        alternarView,
        abrirModalEditarEndereco,
        fecharModal
    };

})();