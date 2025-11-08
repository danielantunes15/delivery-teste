// js/app.js - Módulo Principal de Inicialização

// O evento DOMContentLoaded garante que o HTML foi carregado
document.addEventListener('DOMContentLoaded', async function() {
    
    // O 'app' é um objeto global que os outros módulos usarão
    window.app = {
        // Estado Global do App
        configLoja: { taxa_entrega: 0, tempo_entrega: 60 },
        clienteLogado: null,
        clientePerfil: { nome: null, telefone: null, endereco: null },
        pedidoAtivoId: null,
        supabaseChannel: null,
        
        // Estado dos Módulos (serão preenchidos por eles)
        carrinho: [],
        categorias: [],
        produtos: [],
        historicoPedidos: [],
        produtoSelecionadoModal: null,
        precoBaseModal: 0,
        
        // Referências aos Módulos
        UI: window.AppUI,
        API: window.AppAPI,
        Auth: window.AppAuth,
        Cardapio: window.AppCardapio,
        Carrinho: window.AppCarrinho,
        Checkout: window.AppCheckout,
        Rastreamento: window.AppRastreamento,
        
        // Constantes
        NUMERO_WHATSAPP: '5533984611926' // Mantenha sua constante aqui
    };

    /**
     * Configura todos os event listeners principais da aplicação.
     */
    function configurarEventListenersGlobais() {
        const ui = app.UI.elementos; // Pega os elementos do módulo UI
        
        if (ui.btnIniciarSessao) ui.btnIniciarSessao.addEventListener('click', app.Auth.iniciarSessao);
        if (ui.cadastroForm) ui.cadastroForm.addEventListener('submit', app.Auth.finalizarCadastro);
        if (ui.logoutBtnApp) ui.logoutBtnApp.addEventListener('click', app.Auth.fazerLogoutApp);
        if (ui.formEditarEndereco) ui.formEditarEndereco.addEventListener('submit', app.Auth.salvarEdicaoEndereco); 
        
        if (ui.abrirModalEditarEndereco) ui.abrirModalEditarEndereco.addEventListener('click', app.UI.abrirModalEditarEndereco);
        
        // Listeners do Menu Inferior
        ui.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const viewTarget = item.getAttribute('data-view');
                app.UI.alternarView(viewTarget);
            });
        });
        
        // Botão Finalizar
        if (ui.finalizarDiretoBtn) ui.finalizarDiretoBtn.addEventListener('click', app.Checkout.finalizarPedidoEEnviarWhatsApp);
        
        // Input de Endereço no Carrinho
        if (ui.carrinhoEnderecoInput) {
            ui.carrinhoEnderecoInput.addEventListener('change', (e) => {
                 app.clientePerfil.endereco = e.target.value.trim();
                 app.UI.elementos.carrinhoEnderecoDisplay.textContent = app.clientePerfil.endereco;
            });
        }
        
        // Opções de Pagamento
        ui.opcoesPagamento.forEach(opcao => {
            opcao.addEventListener('click', () => {
                ui.opcoesPagamento.forEach(op => op.classList.remove('selected'));
                opcao.classList.add('selected');
                opcao.querySelector('input[name="pagamento"]').checked = true;
            });
        });
        
        // Listeners do Modal de Opções
        ui.opcoesBtnAdicionar.addEventListener('click', app.Cardapio.aumentarQtdModal);
        ui.opcoesBtnRemover.addEventListener('click', app.Cardapio.diminuirQtdModal);
        ui.btnAdicionarOpcoes.addEventListener('click', app.Cardapio.adicionarItemComOpcoes);
        
        // Fecha modals clicando no 'X'
        ui.modais.forEach(modal => {
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => app.UI.fecharModal(modal));
            }
        });
        
        // Busca de CEP
        if (ui.cadastroCepInput) ui.cadastroCepInput.addEventListener('blur', (e) => app.API.buscarCep(e.target.value));
        if (ui.modalCepInput) ui.modalCepInput.addEventListener('blur', (e) => app.API.buscarCep(e.target.value));
        
        // Ícones do Header (Busca e Compartilhar)
        if (ui.searchIcon) ui.searchIcon.addEventListener('click', app.Cardapio.setupSearch);
        if (ui.shareIcon) ui.shareIcon.addEventListener('click', app.Cardapio.setupShare);
    }

    /**
     * Função de inicialização principal (IIFE)
     */
    (async function() {
        try {
            if (!window.supabase) {
                 throw new Error('Cliente Supabase não encontrado.');
            }
            if (!app.API) {
                throw new Error('Módulo de API não carregado.');
            }

            // 1. Carrega configurações da loja (taxa, horários)
            await app.API.carregarConfiguracoesLoja();

            // 2. Verifica se há um cliente logado
            await app.Auth.verificarSessaoLocal();

            // 3. Prepara a interface inicial
            app.UI.elementos.authScreen.classList.remove('active');
            app.UI.elementos.mobileNav.style.display = 'flex';
            app.UI.alternarView('view-cardapio');
            
            if (app.clienteLogado) {
                 console.log(`Cliente ${app.clientePerfil.nome} carregado.`);
                 // logarClienteManual já inicia o rastreamento se necessário
                 app.Auth.logarClienteManual(false); // false = não mostrar msg de bem-vindo
            } else {
                 console.log("Nenhum cliente logado, iniciando como convidado.");
            }
            
            // 4. Carrega os dados do cardápio
            await app.Cardapio.carregarDadosCardapio();
            
            // 5. Configura o status da loja e busca
            app.Cardapio.updateStoreStatus();
            setInterval(app.Cardapio.updateStoreStatus, 60000); // Atualiza a cada minuto

            // 6. Configura todos os botões e cliques
            configurarEventListenersGlobais();
            
            // 7. Atualiza o carrinho (para exibir R$ 0,00 e taxa de entrega)
            app.Carrinho.atualizarCarrinho();

        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            app.UI.mostrarMensagem('Erro ao carregar o app: ' + error.message, 'error');
            app.UI.elementos.authScreen.classList.add('active'); // Força tela de login em caso de erro grave
        }
    })();
});