// js/ui.js - Módulo de Interface e DOM (Corrigido)

(function() {
    
    /**
     * Formata um número para o padrão de moeda BRL.
     */
    const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

    /**
     * Formata um número de telefone para o padrão E.164 (WhatsApp).
     */
    const formatarTelefone = (telefone) => {
        const digitos = telefone.replace(/\D/g, '');
        return digitos.length >= 12 ? digitos : '55' + digitos;
    };


    // Objeto para armazenar todos os elementos do DOM
    // *** CORREÇÃO: Esta é agora a fonte da verdade para os elementos. ***
    const elementos = {
        // Views
        appContainer: document.getElementById('app-container'),
        authScreen: document.getElementById('auth-screen'),
        mobileNav: document.getElementById('mobile-bottom-nav'),
        views: document.querySelectorAll('.app-view'),
        navItems: document.querySelectorAll('.bottom-nav .nav-item'),
        viewInicio: document.getElementById('view-inicio'),
        viewCardapio: document.getElementById('view-cardapio'),
        viewPromocoes: document.getElementById('view-promocoes'),
        viewCarrinho: document.getElementById('view-carrinho'),
        
        // Alertas
        alertContainer: document.getElementById('alert-container'),
        
        // Auth
        authTelefone: document.getElementById('auth-telefone'),
        btnIniciarSessao: document.getElementById('btn-iniciar-sessao'),
        cadastroForm: document.getElementById('cadastro-form'),
        cadastroTelefoneHidden: document.getElementById('cadastro-telefone-hidden'),
        cadastroNome: document.getElementById('cadastro-nome'),
        cadastroCep: document.getElementById('cadastro-cep'),
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
        rastreamentoSubtitulo: document.getElementById('rastreamento-subtitulo'),
        rastreamentoStatusTexto: document.getElementById('rastreamento-status-texto'),
        stepNovo: document.getElementById('step-novo'),
        stepPreparando: document.getElementById('step-preparando'),
        stepPronto: document.getElementById('step-pronto'),
        stepEntregue: document.getElementById('step-entregue'),
        
        // Histórico Moderno (view-inicio)
        pedidosAtivosContainer: document.getElementById('pedidos-ativos-container'),
        pedidosAtivosList: document.getElementById('pedidos-ativos-list'),
        historicoUltimosPedidos: document.getElementById('historico-ultimos-pedidos'),
        listaUltimosPedidos: document.getElementById('lista-ultimos-pedidos'),
        btnVerTodosPedidos: document.getElementById('btn-ver-todos-pedidos'),
        semPedidosMessage: document.getElementById('sem-pedidos-message'),

        // Cardápio (view-cardapio)
        storeStatusIndicator: document.querySelector('.store-status .status-indicator'),
        storeStatusText: document.querySelector('.store-status .status-text'),
        storeHoursText: document.getElementById('store-hours-text'),
        storeAttentionBar: document.querySelector('.store-status .attention-bar'),
        storeClosedMessage: document.getElementById('store-closed-message'),
        categoriasContainer: document.getElementById('categorias-container'),
        popularScroll: document.getElementById('popular-scroll'),
        productsSection: document.getElementById('products-section'),
        
        // Carrinho (view-carrinho)
        carrinhoBadge: document.getElementById('carrinho-badge'),
        cartCountNav: document.querySelector('.bottom-nav .cart-count'),
        pedidoObservacoes: document.getElementById('pedido-observacoes'),
        trocoParaInput: document.getElementById('troco-para'),
        carrinhoItens: document.getElementById('carrinho-itens'),
        
        // Tela de Confirmação
        pedidoConfirmadoSection: document.getElementById('pedido-confirmado-section'),
        finalPedidoId: document.getElementById('final-pedido-id'),
        finalTotal: document.getElementById('final-total'),
        finalWhatsappLink: document.getElementById('final-whatsapp-link'),
        finalNovoPedidoBtn: document.getElementById('final-novo-pedido-btn'),
        
        // Resumo de Valores
        subtotalCarrinho: document.getElementById('subtotal-carrinho'),
        taxaEntregaCarrinho: document.getElementById('taxa-entrega-carrinho'),
        totalCarrinho: document.getElementById('total-carrinho'),
        
        // Botões e Campos da Tela Única
        checkoutMainView: document.getElementById('checkout-main-view'),
        checkoutFooter: document.getElementById('checkout-footer'),
        finalizarPedidoDireto: document.getElementById('finalizar-pedido-direto'), 
        limparCarrinhoBtn: document.getElementById('limpar-carrinho-btn'),
        addMoreItemsBtn: document.getElementById('add-more-items-btn'),
        trocarEnderecoBtn: document.getElementById('trocar-endereco-btn'),
        tempoEntregaDisplay: document.getElementById('tempo-entrega-display'),
        taxaEntregaStep: document.getElementById('taxa-entrega-step'),
        
        // Cupom
        cupomInput: document.getElementById('cupom-input'),
        aplicarCupomBtn: document.getElementById('aplicar-cupom-btn'),
        cupomMessage: document.getElementById('cupom-message'),
        descontoValorDisplay: document.getElementById('desconto-valor-display'),
        descontoTipoDisplay: document.getElementById('desconto-tipo-display'),
        resumoDescontoLinha: document.getElementById('resumo-desconto-linha'),
        
        // Dados de Cliente/Entrega
        carrinhoEnderecoDisplay: document.getElementById('carrinho-endereco-display'),
        carrinhoClienteNome: document.getElementById('carrinho-cliente-nome'),
        carrinhoEnderecoInput: document.getElementById('carrinho-endereco-input'),
        opcoesPagamento: document.querySelectorAll('.opcoes-pagamento .pagamento-opcao'),

        // Modais
        modais: document.querySelectorAll('.modal'),
        modalEditarEndereco: document.getElementById('modal-editar-endereco'),
        formEditarEndereco: document.getElementById('form-editar-endereco'),
        modalCep: document.getElementById('modal-cep'),
        modalRuaInput: document.getElementById('modal-rua'),
        modalNumeroInput: document.getElementById('modal-numero'),
        modalBairroInput: document.getElementById('modal-bairro'),
        modalCidade: document.getElementById('modal-cidade'),
        modalEstado: document.getElementById('modal-estado'),
        
        modalDetalhesPedido: document.getElementById('modal-detalhes-pedido'),
        detalhesModalTitulo: document.getElementById('detalhes-modal-titulo'),
        detalhesPedidoId: document.getElementById('detalhes-pedido-id'),
        detalhesPedidoContent: document.getElementById('detalhes-pedido-content'),

        modalOpcoesProduto: document.getElementById('modal-opcoes-produto'),
        opcoesTitulo: document.getElementById('opcoes-titulo'),
        opcoesImagemProduto: document.getElementById('opcoes-imagem-produto'),
        opcoesImagemPlaceholder: document.getElementById('opcoes-imagem-placeholder'),
        opcoesDescricao: document.getElementById('opcoes-descricao'),
        opcoesContainer: document.getElementById('opcoes-container'),
        complementosContainer: document.getElementById('complementos-container'),
        opcoesObservacao: document.getElementById('opcoes-observacao'),
        opcoesBtnRemover: document.getElementById('opcoes-btn-remover'),
        opcoesQuantidadeValor: document.getElementById('opcoes-quantidade-valor'),
        opcoesBtnAdicionar: document.getElementById('opcoes-btn-adicionar'),
        opcoesPrecoModal: document.getElementById('opcoes-preco-modal'),
        btnAdicionarOpcoes: document.getElementById('btn-adicionar-opcoes'),
        
        // Header v2
        headerV2: document.getElementById('header-v2'),
        headerV2Logo: document.getElementById('header-v2-logo'),
        headerV2Actions: document.getElementById('header-v2-actions'),
        headerV2SearchToggle: document.getElementById('header-v2-search-toggle'),
        headerV2SearchContainer: document.getElementById('header-v2-search-container'),
        headerSearchInput: document.getElementById('header-search-input'), 
        headerV2LoginBtn: document.getElementById('header-v2-login-btn'),
        headerV2AddressBtn: document.getElementById('header-v2-address-btn'),
        headerV2AddressText: document.getElementById('header-v2-address-text'),
        
        // Header Cart v2
        headerV2CartBtn: document.getElementById('header-v2-cart-btn'),
        headerV2CartItems: document.getElementById('header-v2-cart-items'),
        headerV2CartTotal: document.getElementById('header-v2-cart-total'),
    };

    /**
     * Exibe uma mensagem de alerta no topo da tela.
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
     */
    function alternarView(viewId) {
        if ((viewId === 'view-inicio' || viewId === 'view-carrinho') && !window.app.clienteLogado) {
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
        
        elementos.navItems.forEach(item => {
             item.classList.toggle('active', item.getAttribute('data-view') === viewId);
        });
        
        // Se a view for carrinho, esconde o footer padrão e mostra o footer do checkout
        if (viewId === 'view-carrinho') {
            elementos.checkoutMainView.style.display = 'block';
            elementos.checkoutFooter.style.display = 'block';
            elementos.pedidoConfirmadoSection.style.display = 'none'; // Garante que a tela de sucesso esteja oculta
            window.AppCarrinho.atualizarCarrinhoDisplay();
        } else {
            elementos.checkoutFooter.style.display = 'none';
        }

        // Se a view for cardápio, reseta a busca
        if (viewId === 'view-cardapio') {
            elementos.headerSearchInput.value = '';
            window.AppCardapio.filtrarProdutos('');
            elementos.headerV2.classList.remove('search-active');
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
        const enderecoSalvo = perfil.endereco || '';
        
        const cepMatch = enderecoSalvo.match(/\(CEP:\s?(\d{5}-?\d{3})\)/);
        const cidadeEstadoMatch = enderecoSalvo.match(/\s-\s(.*?)\/([A-Z]{2})\s/);
        
        elementos.modalCep.value = cepMatch ? cepMatch[1] : '';
        elementos.modalCidade.value = cidadeEstadoMatch ? cidadeEstadoMatch[1].trim() : '';
        elementos.modalEstado.value = cidadeEstadoMatch ? cidadeEstadoMatch[2].trim() : '';
        
        const parteInicial = enderecoSalvo.split(' - ')[0];
        const partesEndereco = parteInicial.split(',').map(p => p.trim());
        
        if (partesEndereco.length >= 3) {
            elementos.modalRuaInput.value = partesEndereco[0] || '';
            elementos.modalNumeroInput.value = partesEndereco[1] || '';
            elementos.modalBairroInput.value = partesEndereco[2] || '';
        } else {
            elementos.modalRuaInput.value = parteInicial; // Fallback
            elementos.modalNumeroInput.value = '';
            elementos.modalBairroInput.value = '';
        }
        
        elementos.modalEditarEndereco.style.display = 'flex';
        elementos.formEditarEndereco.reset(); // Limpa erros de validação
    }
    
    /**
     * Fecha um modal específico.
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