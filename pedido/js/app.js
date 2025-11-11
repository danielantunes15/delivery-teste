// js/app.js - Módulo Principal de Inicialização (Com Persistência)

// O 'app' é um objeto global que os outros módulos usarão.
// Ele é definido IMEDIATAMENTE, antes do DOM carregar.
window.app = {
    // Estado Global do App
    configLoja: { taxa_entrega: 0, tempo_entrega: 60 },
    clienteLogado: null,
    clientePerfil: { nome: null, telefone: null, endereco: null },
    pedidoAtivoId: null,
    supabaseChannel: null,
    
    // **NOVAS PROPRIEDADES DE ESTADO GLOBAL ADICIONADAS AQUI**
    passoAtual: 1, 
    cupomAplicado: null, // Estado do cupom
    
    // Estado dos Módulos (serão preenchidos por eles)
    carrinho: [],
    categorias: [],
    produtos: [],
    historicoPedidos: [],
    produtoSelecionadoModal: null,
    precoBaseModal: 0,
    
    // Referências aos Módulos (serão preenchidas depois)
    UI: null,
    API: null,
    Auth: null,
    Cardapio: null,
    Carrinho: null,
    Checkout: null,
    Rastreamento: null,
    
    // Constantes
    NUMERO_WHATSAPP: '5533984611926'
};


// O evento DOMContentLoaded garante que o HTML foi carregado
document.addEventListener('DOMContentLoaded', async function() {
    
    // 1. Vincula os módulos ao 'app' global
    // (Neste ponto, 'defer' garantiu que ui.js, api.js, etc., já rodaram e criaram seus objetos globais)
    app.UI = window.AppUI;
    app.API = window.AppAPI;
    app.Auth = window.AppAuth;
    app.Cardapio = window.AppCardapio;
    app.Carrinho = window.AppCarrinho;
    app.Checkout = window.AppCheckout;
    app.Rastreamento = window.AppRastreamento;

    // Verifica se os módulos essenciais carregaram
    if (!app.UI || !app.API || !app.Auth || !app.Carrinho || !app.Cardapio || !app.Checkout || !app.Rastreamento) {
        console.error("❌ ERRO GRAVE: Um ou mais módulos falharam ao carregar.");
        alert("Erro crítico ao carregar o aplicativo. Verifique o console.");
        return;
    }

    /**
     * Configura todos os event listeners principais da aplicação.
     * ADICIONADA VERIFICAÇÃO DE NULOS em todos os listeners.
     */
    function configurarEventListenersGlobais() {
        const ui = app.UI.elementos;
        
        if (!ui) {
            console.error("❌ Falha crítica: Módulo de UI não carregou os elementos.");
            return;
        }
        
        // Listeners de Autenticação
        if (ui.btnIniciarSessao) ui.btnIniciarSessao.addEventListener('click', app.Auth.iniciarSessao);
        if (ui.cadastroForm) ui.cadastroForm.addEventListener('submit', app.Auth.finalizarCadastro);
        if (ui.logoutBtnApp) ui.logoutBtnApp.addEventListener('click', app.Auth.fazerLogoutApp);
        if (ui.formEditarEndereco) ui.formEditarEndereco.addEventListener('submit', app.Auth.salvarEdicaoEndereco); 
        if (ui.abrirModalEditarEndereco) ui.abrirModalEditarEndereco.addEventListener('click', app.UI.abrirModalEditarEndereco);
        
        // Listeners do Menu Inferior
        if (ui.navItems) {
            ui.navItems.forEach(item => {
                if(item) item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const viewTarget = item.getAttribute('data-view');
                    app.UI.alternarView(viewTarget);
                });
            });
        }
        
        // Listeners do Checkout (Single Screen)
        if (ui.finalizarPedidoDireto) ui.finalizarPedidoDireto.addEventListener('click', app.Checkout.finalizarPedidoEEnviarWhatsApp);
        
        // Botões Limpar, Adicionar mais, Trocar Endereço
        if (ui.limparCarrinhoBtn) ui.limparCarrinhoBtn.addEventListener('click', app.Carrinho.limparCarrinho);
        if (ui.addMoreItemsBtn) ui.addMoreItemsBtn.addEventListener('click', () => app.UI.alternarView('view-cardapio'));
        if (ui.trocarEnderecoBtn) ui.trocarEnderecoBtn.addEventListener('click', app.UI.abrirModalEditarEndereco);
        
        // Lógica de Pagamento
        if (ui.opcoesPagamento) {
            ui.opcoesPagamento.forEach(opcao => {
                if(opcao) opcao.addEventListener('click', () => {
                    ui.opcoesPagamento.forEach(op => op.classList.remove('selected'));
                    opcao.classList.add('selected');
                    const input = opcao.querySelector('input[name="pagamento"]');
                    if (input) input.checked = true;
                });
            });
        }
        
        // Listeners do Modal de Opções
        if (ui.opcoesBtnAdicionar) ui.opcoesBtnAdicionar.addEventListener('click', app.Cardapio.aumentarQtdModal);
        if (ui.opcoesBtnRemover) ui.opcoesBtnRemover.addEventListener('click', app.Cardapio.diminuirQtdModal);
        if (ui.btnAdicionarOpcoes) ui.btnAdicionarOpcoes.addEventListener('click', app.Cardapio.adicionarItemComOpcoes);
        
        // Listeners de Modais (Fechar)
        if (ui.modais) {
            ui.modais.forEach(modal => {
                if (modal) {
                    const closeBtn = modal.querySelector('.close');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => app.UI.fecharModal(modal));
                    }
                }
            });
        }
        
        // Listeners de Busca de CEP
        if (ui.cadastroCepInput) ui.cadastroCepInput.addEventListener('blur', (e) => app.API.buscarCep(e.target.value));
        if (ui.modalCepInput) ui.modalCepInput.addEventListener('blur', (e) => app.API.buscarCep(e.target.value));
        
        /* --- INÍCIO DA ALTERAÇÃO: Listeners do Header v2 --- */
        
        // Busca: Dispara a CADA TECLA digitada no input
        if (ui.headerSearchInput) ui.headerSearchInput.addEventListener('input', app.Cardapio.setupSearch);
        
        // Botão de Login/Conta (ícone de usuário)
        if (ui.loginBtn) ui.loginBtn.addEventListener('click', () => app.UI.alternarView('view-inicio'));
        
        // Botão de Carrinho (ícone de sacola)
        if (ui.headerCartBtn) ui.headerCartBtn.addEventListener('click', () => app.UI.alternarView('view-carrinho'));
        
        // Botão de Endereço
        if (ui.addressBtn) ui.addressBtn.addEventListener('click', () => app.UI.abrirModalEditarEndereco());
        
        // NOVO: Lógica do botão de busca (Lupa) no mobile
        if (ui.headerV2SearchToggle) {
            ui.headerV2SearchToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                ui.headerV2.classList.add('search-active');
                ui.headerSearchInput.focus();
            });
        }
        
        // NOVO: Lógica para fechar a busca no mobile ao perder o foco
        if (ui.headerSearchInput) {
            ui.headerSearchInput.addEventListener('blur', () => {
                // Adiciona um pequeno delay para caso o usuário clique em um item
                setTimeout(() => {
                    ui.headerV2.classList.remove('search-active');
                }, 100);
            });
        }
        /* --- FIM DA ALTERAÇÃO --- */
    }

    /**
     * Função de inicialização principal (IIFE interna)
     */
    (async function() {
        try {
            if (!window.supabase) throw new Error('Cliente Supabase não encontrado.');

            // 1. Carrega configurações da loja
            await app.API.carregarConfiguracoesLoja();

            // 2. Verifica se há um cliente logado
            await app.Auth.verificarSessaoLocal();
            
            // 3. Prepara a interface inicial
            app.UI.elementos.mobileNav.style.display = 'flex';
            
            // 4. Carrega os dados do cardápio (produtos e categorias)
            await app.Cardapio.carregarDadosCardapio(); // <-- Carrega produtos ANTES do carrinho
            
            // 5. Carrega o carrinho persistido
            app.Carrinho.carregarCarrinhoLocalmente(); // <-- POSICIONAMENTO CRÍTICO

            if (app.clienteLogado) {
                 console.log(`Cliente ${app.clientePerfil.nome} carregado.`);
                 // Se logado, vai direto para o cardápio, loga e carrega status.
                 app.Auth.logarClienteManual(false); 
                 app.UI.alternarView('view-cardapio');
            } else {
                 console.log("Nenhum cliente logado, iniciando como convidado.");
                 // Se não logado, vai para o cardápio e mantém a navegação bloqueada para Carrinho/Pedidos.
                 app.UI.alternarView('view-cardapio');
                 // O 'auth-screen' fica acessível apenas pelo menu inferior ou tentativa de checkout.
            }
            
            // 6. Configura o status da loja e busca
            app.Cardapio.updateStoreStatus();
            setInterval(app.Cardapio.updateStoreStatus, 60000);

            // 7. Configura todos os botões e cliques
            configurarEventListenersGlobais();
            
            // 8. Atualiza o carrinho
            app.Carrinho.atualizarCarrinho();

        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            if (app.UI) {
                app.UI.mostrarMensagem('Erro ao carregar o app: ' + error.message, 'error');
            }
            // Se houver um erro crítico, mostra a tela de login como fallback
            if (app.UI && app.UI.elementos.authScreen) {
                app.UI.elementos.authScreen.classList.add('active');
            }
        }
    })();
});