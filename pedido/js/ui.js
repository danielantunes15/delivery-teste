// js/ui.js - Módulo de Interface e DOM (Corrigido)

(function() {
    
    // ================================================================
    // === INÍCIO DA CORREÇÃO (Adicionando funções utilitárias) ===
    // ================================================================

    /**
     * Formata um número para o padrão de moeda BRL.
     * @param {number} valor - O valor a ser formatado.
     * @returns {string} - O valor formatado (ex: "R$ 10,50").
     */
    const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

    /**
     * Formata um número de telefone para o padrão E.164 (WhatsApp).
     * @param {string} telefone - O telefone (ex: "(33) 99999-9999").
     * @returns {string} - O telefone formatado (ex: "5533999999999").
     */
    const formatarTelefone = (telefone) => {
        const digitos = telefone.replace(/\D/g, '');
        // Garante que o 55 (código do Brasil) esteja presente
        return digitos.length >= 12 ? digitos : '55' + digitos;
    };
    // ================================================================
    // === FIM DA CORREÇÃO ===
    // ================================================================


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
        
        // Carrinho (view-carrinho) - ATUALIZADO PARA STEPS
        carrinhoBadge: document.getElementById('carrinho-badge'),
        cartCountNav: document.querySelector('.bottom-nav .cart-count'),
        pedidoObservacoes: document.getElementById('pedido-observacoes'),
        trocoParaInput: document.getElementById('troco-para'),
        carrinhoItens: document.getElementById('carrinho-itens'),
        
        // Resumo de Valores - ATUALIZADO
        subtotalCarrinho: document.getElementById('subtotal-carrinho'),
        taxaEntregaCarrinho: document.getElementById('taxa-entrega-carrinho'),
        totalCarrinho: document.getElementById('total-carrinho'),
        
        // Elementos do Checkout Step
        stepCarrinho: document.getElementById('step-carrinho'),
        stepEntrega: document.getElementById('step-entrega'),
        stepPagamento: document.getElementById('step-pagamento'),
        btnContinuar: document.getElementById('btn-continuar'),
        btnPassoAnterior: document.getElementById('btn-passo-anterior'),
        limparCarrinhoBtn: document.getElementById('limpar-carrinho-btn'),
        addMoreItemsBtn: document.getElementById('add-more-items-btn'),
        trocarEnderecoBtn: document.getElementById('trocar-endereco-btn'),
        tempoEntregaDisplay: document.getElementById('tempo-entrega-display'),
        taxaEntregaStep: document.getElementById('taxa-entrega-step'),
        
        // Cupom - NOVO
        cupomInput: document.getElementById('cupom-input'),
        aplicarCupomBtn: document.getElementById('aplicar-cupom-btn'),
        cupomMessage: document.getElementById('cupom-message'),
        descontoValorDisplay: document.getElementById('desconto-valor-display'),
        descontoTipoDisplay: document.getElementById('desconto-tipo-display'),
        resumoDescontoLinha: document.getElementById('resumo-desconto-linha'),
        
        // Finalizar
        finalizarPedidoDireto: document.getElementById('finalizar-pedido-direto'), // Botão FINALIZAR
        
        // Dados de Cliente/Entrega
        carrinhoEnderecoDisplay: document.getElementById('carrinho-endereco-display'),
        carrinhoClienteNomeDisplay: document.getElementById('carrinho-cliente-nome'),
        carrinhoEnderecoInput: document.getElementById('carrinho-endereco-input'), // Campo oculto para editar
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
        
        /* --- INÍCIO DA ALTERAÇÃO --- */
        // --- ELEMENTOS DO NOVO HEADER v2 ---
        headerV2: document.getElementById('header-v2'),
        headerV2Logo: document.getElementById('header-v2-logo'),
        headerV2Actions: document.getElementById('header-v2-actions'),
        headerV2SearchToggle: document.getElementById('header-v2-search-toggle'),
        headerV2SearchContainer: document.getElementById('header-v2-search-container'),
        headerSearchInput: document.getElementById('header-search-input'), // Renomeado de 'searchIcon'
        loginBtn: document.getElementById('header-v2-login-btn'),
        addressBtn: document.getElementById('header-v2-address-btn'),
        addressText: document.getElementById('header-v2-address-text'),
        
        // --- ELEMENTOS DO NOVO HEADER CART v2 ---
        headerCartBtn: document.getElementById('header-v2-cart-btn'),
        headerCartItems: document.getElementById('header-v2-cart-items'),
        headerCartTotal: document.getElementById('header-v2-cart-total'),
        
        // --- ELEMENTOS DO MODAL DE OPÇÕES ---
        opcoesImagemProduto: document.getElementById('opcoes-imagem-produto'),
        opcoesImagemPlaceholder: document.getElementById('opcoes-imagem-placeholder')
        /* --- FIM DA ALTERAÇÃO --- */
    };

    /**
     * Exibe uma mensagem de alerta no topo da tela.
     * @param {string} mensagem - O texto a ser exibido.
     * @param {string} [tipo='info'] - O tipo de alerta ('info', 'success', 'warning', 'error').
     */
    function mostrarMensagem(mensagem, tipo = 'info') {
        // As mensagens agora só aparecerão no console do navegador (F12)
        console.log(`[Mensagem Oculta - ${tipo}]: ${mensagem}`);
    }

    /**
     * Alterna a visualização das "páginas" do app.
     * @param {string} viewId - O ID da view a ser mostrada (ex: 'view-cardapio').
     */
    function alternarView(viewId) {
        // Guarda de Rota
        if ((viewId === 'view-inicio' || viewId === 'view-carrinho') && !window.app.clienteLogado) {
            // A função mostrarMensagem() agora está desativada,
            // mas a lógica de bloqueio de rota continua.
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
        fecharModal,
        formatarMoeda,
        formatarTelefone
    };

})();