// js/app.js - Arquivo Principal do App (Versão Corrigida)

(function() {
    
    // Estado Global da Aplicação
    window.app = {
        // Configurações e Estado
        configLoja: {
            aberto: false,
            horario_abertura: "08:00",
            horario_fechamento: "22:00",
            tempo_entrega: 60,
            taxa_entrega: 5.00
        },
        clienteLogado: false,
        clientePerfil: null,
        carrinhoItens: [],
        pedidoAtivoId: null,
        supabaseChannel: null,
        todosPedidosCliente: [], // Novo: Array para armazenar todos os pedidos do cliente
        
        // Elementos da DOM
        elementos: {
            // Containers de Views
            appContainer: document.getElementById('app-container'),
            authScreen: document.getElementById('auth-screen'),
            viewInicio: document.getElementById('view-inicio'),
            viewCardapio: document.getElementById('view-cardapio'),
            viewPromocoes: document.getElementById('view-promocoes'),
            viewCarrinho: document.getElementById('view-carrinho'),
            
            // Auth Screen
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
            
            // View Inicio
            homeClienteNome: document.getElementById('home-cliente-nome'),
            homeEndereco: document.getElementById('home-endereco'),
            logoutBtnApp: document.getElementById('logout-btn-app'),
            abrirModalEditarEndereco: document.getElementById('abrir-modal-editar-endereco'),
            
            // Rastreamento
            rastreamentoContainer: document.getElementById('rastreamento-pedido-ativo'),
            rastreamentoPedidoId: document.getElementById('rastreamento-pedido-id'),
            rastreamentoSubtitulo: document.getElementById('rastreamento-subtitulo'),
            rastreamentoStatusTexto: document.getElementById('rastreamento-status-texto'),
            stepNovo: document.getElementById('step-novo'),
            stepPreparando: document.getElementById('step-preparando'),
            stepPronto: document.getElementById('step-pronto'),
            stepEntregue: document.getElementById('step-entregue'),
            
            // NOVOS ELEMENTOS - Histórico Moderno
            statusUltimoPedido: document.getElementById('status-ultimo-pedido'),
            pedidosAtivosContainer: document.getElementById('pedidos-ativos-container'),
            pedidosAtivosList: document.getElementById('pedidos-ativos-list'),
            historicoUltimosPedidos: document.getElementById('historico-ultimos-pedidos'),
            listaUltimosPedidos: document.getElementById('lista-ultimos-pedidos'),
            btnVerTodosPedidos: document.getElementById('btn-ver-todos-pedidos'),
            semPedidosMessage: document.getElementById('sem-pedidos-message'),
            
            // View Cardápio
            headerV2: document.getElementById('header-v2'),
            headerV2Logo: document.getElementById('header-v2-logo'),
            headerV2SearchContainer: document.getElementById('header-v2-search-container'),
            headerSearchInput: document.getElementById('header-search-input'),
            headerV2Actions: document.getElementById('header-v2-actions'),
            headerV2AddressBtn: document.getElementById('header-v2-address-btn'),
            headerV2AddressText: document.getElementById('header-v2-address-text'),
            headerV2SearchToggle: document.getElementById('header-v2-search-toggle'),
            headerV2LoginBtn: document.getElementById('header-v2-login-btn'),
            headerV2CartBtn: document.getElementById('header-v2-cart-btn'),
            headerV2CartTotal: document.getElementById('header-v2-cart-total'),
            headerV2CartItems: document.getElementById('header-v2-cart-items'),
            
            // Status da Loja
            statusIndicator: document.querySelector('.status-indicator'),
            statusText: document.querySelector('.status-text'),
            storeHoursText: document.getElementById('store-hours-text'),
            attentionBar: document.querySelector('.attention-bar'),
            storeClosedMessage: document.getElementById('store-closed-message'),
            
            // Categorias e Produtos
            categoriasContainer: document.getElementById('categorias-container'),
            popularScroll: document.getElementById('popular-scroll'),
            productsSection: document.getElementById('products-section'),
            
            // View Carrinho
            pedidoConfirmadoSection: document.getElementById('pedido-confirmado-section'),
            finalPedidoId: document.getElementById('final-pedido-id'),
            finalTotal: document.getElementById('final-total'),
            finalWhatsappLink: document.getElementById('final-whatsapp-link'),
            finalNovoPedidoBtn: document.getElementById('final-novo-pedido-btn'),
            
            checkoutMainView: document.getElementById('checkout-main-view'),
            limparCarrinhoBtn: document.getElementById('limpar-carrinho-btn'),
            carrinhoItensContainer: document.getElementById('carrinho-itens-container'),
            carrinhoItens: document.getElementById('carrinho-itens'),
            addMoreItemsBtn: document.getElementById('add-more-items-btn'),
            
            // Cupom
            cupomInput: document.getElementById('cupom-input'),
            aplicarCupomBtn: document.getElementById('aplicar-cupom-btn'),
            cupomMessage: document.getElementById('cupom-message'),
            
            // Resumo
            subtotalCarrinho: document.getElementById('subtotal-carrinho'),
            resumoDescontoLinha: document.getElementById('resumo-desconto-linha'),
            descontoTipoDisplay: document.getElementById('desconto-tipo-display'),
            descontoValorDisplay: document.getElementById('desconto-valor-display'),
            taxaEntregaCarrinho: document.getElementById('taxa-entrega-carrinho'),
            totalCarrinho: document.getElementById('total-carrinho'),
            
            // Endereço no Carrinho
            carrinhoEnderecoDisplay: document.getElementById('carrinho-endereco-display'),
            carrinhoClienteNome: document.getElementById('carrinho-cliente-nome'),
            carrinhoEnderecoInput: document.getElementById('carrinho-endereco-input'),
            trocarEnderecoBtn: document.getElementById('trocar-endereco-btn'),
            
            // Entrega
            tempoEntregaDisplay: document.getElementById('tempo-entrega-display'),
            taxaEntregaStep: document.getElementById('taxa-entrega-step'),
            
            // Pagamento
            opcoesPagamento: document.querySelectorAll('.pagamento-opcao'),
            pedidoObservacoes: document.getElementById('pedido-observacoes'),
            trocoGroup: document.getElementById('troco-group'),
            trocoPara: document.getElementById('troco-para'),
            
            // Footer do Carrinho
            checkoutFooter: document.getElementById('checkout-footer'),
            finalizarPedidoDireto: document.getElementById('finalizar-pedido-direto'),
            
            // Navegação Mobile
            mobileBottomNav: document.getElementById('mobile-bottom-nav'),
            navItems: document.querySelectorAll('.nav-item-app'),
            navCarrinhoBtn: document.getElementById('nav-carrinho-btn'),
            carrinhoBadge: document.getElementById('carrinho-badge'),
            
            // Modals
            modalEditarEndereco: document.getElementById('modal-editar-endereco'),
            modalCep: document.getElementById('modal-cep'),
            modalRuaInput: document.getElementById('modal-rua'),
            modalNumeroInput: document.getElementById('modal-numero'),
            modalBairroInput: document.getElementById('modal-bairro'),
            modalCidade: document.getElementById('modal-cidade'),
            modalEstado: document.getElementById('modal-estado'),
            formEditarEndereco: document.getElementById('form-editar-endereco'),
            
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
            btnAdicionarOpcoes: document.getElementById('btn-adicionar-opcoes')
        },

        // Inicialização da Aplicação
        init: function() {
            console.log('Iniciando App Doce Criativo...');
            
            this.verificarElementos();
            this.inicializarEventListeners();
            this.carregarConfiguracoesIniciais();
            this.verificarLoginAnterior();
        },

        // Verificar se todos os elementos essenciais existem
        verificarElementos: function() {
            const elementosEssenciais = [
                'authTelefone', 'btnIniciarSessao', 'loginFormGroup', 'cadastroForm'
            ];
            
            for (const elemento of elementosEssenciais) {
                if (!this.elementos[elemento]) {
                    console.error(`Elemento essencial não encontrado: ${elemento}`);
                }
            }
        },

        // Carregar Configurações Iniciais
        carregarConfiguracoesIniciais: async function() {
            try {
                await window.AppAPI.carregarConfiguracoesLoja();
                console.log('Configurações da loja carregadas:', this.configLoja);
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
            }
        },

        // Verificar se o usuário já estava logado
        verificarLoginAnterior: function() {
            const clienteSalvo = localStorage.getItem('clientePerfil');
            const pedidoAtivo = localStorage.getItem('pedidoAtivoId');
            
            if (clienteSalvo) {
                try {
                    this.clientePerfil = JSON.parse(clienteSalvo);
                    this.clienteLogado = true;
                    this.atualizarUIposLogin();
                    
                    // Se há um pedido ativo, inicia o rastreamento
                    if (pedidoAtivo) {
                        this.pedidoAtivoId = pedidoAtivo;
                        if (window.AppRastreamento) {
                            window.AppRastreamento.iniciarRastreamento(pedidoAtivo);
                        }
                    } else {
                        // Carrega o histórico de pedidos
                        if (window.AppRastreamento) {
                            window.AppRastreamento.carregarStatusUltimoPedido();
                        }
                    }
                    
                } catch (e) {
                    console.error('Erro ao recuperar dados do cliente:', e);
                    localStorage.removeItem('clientePerfil');
                    this.mostrarView('auth-screen');
                }
            } else {
                this.mostrarView('auth-screen');
            }
        },

        // Inicializar Event Listeners
        inicializarEventListeners: function() {
            const el = this.elementos;

            // Auth Screen - Verificar se elementos existem antes de adicionar listeners
            if (el.btnIniciarSessao) {
                el.btnIniciarSessao.addEventListener('click', () => {
                    if (window.AppAuth && window.AppAuth.iniciarSessao) {
                        window.AppAuth.iniciarSessao();
                    }
                });
            }
            
            if (el.cadastroForm) {
                el.cadastroForm.addEventListener('submit', (e) => {
                    if (window.AppAuth && window.AppAuth.finalizarCadastro) {
                        window.AppAuth.finalizarCadastro(e);
                    }
                });
            }
            
            // Input de telefone com máscara
            if (el.authTelefone) {
                el.authTelefone.addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 11) value = value.substring(0, 11);
                    
                    if (value.length > 0) {
                        if (value.length <= 2) {
                            value = value.replace(/^(\d{0,2})/, '($1');
                        } else if (value.length <= 7) {
                            value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
                        } else {
                            value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                        }
                    }
                    e.target.value = value;
                });
            }

            // CEP - Busca automática
            if (el.cadastroCep) {
                el.cadastroCep.addEventListener('blur', function(e) {
                    const cep = e.target.value.replace(/\D/g, '');
                    if (cep.length === 8 && window.AppAPI && window.AppAPI.buscarCep) {
                        window.AppAPI.buscarCep(cep);
                    }
                });
            }

            if (el.modalCep) {
                el.modalCep.addEventListener('blur', function(e) {
                    const cep = e.target.value.replace(/\D/g, '');
                    if (cep.length === 8 && window.AppAPI && window.AppAPI.buscarCep) {
                        window.AppAPI.buscarCep(cep);
                    }
                });
            }

            // Logout
            if (el.logoutBtnApp) {
                el.logoutBtnApp.addEventListener('click', () => {
                    if (window.AppAuth && window.AppAuth.fazerLogout) {
                        window.AppAuth.fazerLogout();
                    }
                });
            }

            // Header Cardápio
            if (el.headerV2SearchToggle) {
                el.headerV2SearchToggle.addEventListener('click', () => this.toggleBuscaHeader());
            }

            if (el.headerV2LoginBtn) {
                el.headerV2LoginBtn.addEventListener('click', () => this.mostrarView('view-inicio'));
            }

            if (el.headerV2CartBtn) {
                el.headerV2CartBtn.addEventListener('click', () => this.mostrarView('view-carrinho'));
            }

            // Navegação Mobile
            if (el.navItems && el.navItems.length > 0) {
                el.navItems.forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        const view = item.getAttribute('data-view');
                        this.mostrarView(view);
                        
                        // Atualizar estado ativo
                        el.navItems.forEach(nav => nav.classList.remove('active'));
                        item.classList.add('active');
                    });
                });
            }

            // Modal Editar Endereço
            if (el.abrirModalEditarEndereco) {
                el.abrirModalEditarEndereco.addEventListener('click', () => {
                    this.preencherModalEndereco();
                    if (el.modalEditarEndereco) {
                        el.modalEditarEndereco.style.display = 'flex';
                    }
                });
            }

            if (el.formEditarEndereco) {
                el.formEditarEndereco.addEventListener('submit', (e) => {
                    if (window.AppAuth && window.AppAuth.salvarEdicaoEndereco) {
                        window.AppAuth.salvarEdicaoEndereco(e);
                    }
                });
            }

            // Fechar Modais
            document.querySelectorAll('.close').forEach(closeBtn => {
                closeBtn.addEventListener('click', function() {
                    const modal = this.closest('.modal');
                    if (window.AppUI && window.AppUI.fecharModal) {
                        window.AppUI.fecharModal(modal);
                    }
                });
            });

            // Clique fora do modal para fechar
            window.addEventListener('click', function(e) {
                if (e.target.classList.contains('modal')) {
                    if (window.AppUI && window.AppUI.fecharModal) {
                        window.AppUI.fecharModal(e.target);
                    }
                }
            });

            // Carrinho
            if (el.limparCarrinhoBtn) {
                el.limparCarrinhoBtn.addEventListener('click', () => {
                    if (window.AppCarrinho && window.AppCarrinho.limparCarrinho) {
                        window.AppCarrinho.limparCarrinho();
                    }
                });
            }

            if (el.addMoreItemsBtn) {
                el.addMoreItemsBtn.addEventListener('click', () => this.mostrarView('view-cardapio'));
            }

            if (el.trocarEnderecoBtn) {
                el.trocarEnderecoBtn.addEventListener('click', () => {
                    if (el.modalEditarEndereco) {
                        el.modalEditarEndereco.style.display = 'flex';
                    }
                });
            }

            // Cupom
            if (el.aplicarCupomBtn) {
                el.aplicarCupomBtn.addEventListener('click', () => {
                    if (window.AppCarrinho && window.AppCarrinho.aplicarCupom) {
                        window.AppCarrinho.aplicarCupom();
                    }
                });
            }

            if (el.cupomInput) {
                el.cupomInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (window.AppCarrinho && window.AppCarrinho.aplicarCupom) {
                            window.AppCarrinho.aplicarCupom();
                        }
                    }
                });
            }

            // Pagamento
            if (el.opcoesPagamento && el.opcoesPagamento.length > 0) {
                el.opcoesPagamento.forEach(opcao => {
                    opcao.addEventListener('click', function() {
                        el.opcoesPagamento.forEach(o => o.classList.remove('selected'));
                        this.classList.add('selected');
                    });
                });
            }

            // Finalizar Pedido
            if (el.finalizarPedidoDireto) {
                el.finalizarPedidoDireto.addEventListener('click', () => {
                    if (window.AppCheckout && window.AppCheckout.finalizarPedido) {
                        window.AppCheckout.finalizarPedido();
                    }
                });
            }

            if (el.finalNovoPedidoBtn) {
                el.finalNovoPedidoBtn.addEventListener('click', () => {
                    if (el.pedidoConfirmadoSection) {
                        el.pedidoConfirmadoSection.style.display = 'none';
                    }
                    if (el.checkoutMainView) {
                        el.checkoutMainView.style.display = 'block';
                    }
                    this.mostrarView('view-cardapio');
                    if (window.AppCarrinho && window.AppCarrinho.limparCarrinho) {
                        window.AppCarrinho.limparCarrinho();
                    }
                });
            }

            // Opções de Produto Modal
            if (el.opcoesBtnRemover) {
                el.opcoesBtnRemover.addEventListener('click', () => {
                    if (window.AppCardapio && window.AppCardapio.alterarQuantidadeOpcoes) {
                        window.AppCardapio.alterarQuantidadeOpcoes(-1);
                    }
                });
            }

            if (el.opcoesBtnAdicionar) {
                el.opcoesBtnAdicionar.addEventListener('click', () => {
                    if (window.AppCardapio && window.AppCardapio.alterarQuantidadeOpcoes) {
                        window.AppCardapio.alterarQuantidadeOpcoes(1);
                    }
                });
            }

            if (el.btnAdicionarOpcoes) {
                el.btnAdicionarOpcoes.addEventListener('click', () => {
                    if (window.AppCardapio && window.AppCardapio.adicionarAoCarrinhoComOpcoes) {
                        window.AppCardapio.adicionarAoCarrinhoComOpcoes();
                    }
                });
            }

            // Busca no Header
            if (el.headerSearchInput) {
                el.headerSearchInput.addEventListener('input', (e) => {
                    if (window.AppCardapio && window.AppCardapio.filtrarProdutos) {
                        window.AppCardapio.filtrarProdutos(e.target.value);
                    }
                });
            }

            console.log('Event listeners inicializados com sucesso.');
        },

        // Toggle Busca no Header
        toggleBuscaHeader: function() {
            const el = this.elementos;
            if (el.headerV2) {
                el.headerV2.classList.toggle('search-active');
                
                if (el.headerV2.classList.contains('search-active') && el.headerSearchInput) {
                    setTimeout(() => el.headerSearchInput.focus(), 300);
                }
            }
        },

        // Preencher Modal de Endereço
        preencherModalEndereco: function() {
            if (!this.clientePerfil || !this.clientePerfil.endereco) return;
            
            const endereco = this.clientePerfil.endereco;
            const el = this.elementos;
            
            // Verificar se os elementos existem
            if (!el.modalRuaInput || !el.modalNumeroInput || !el.modalBairroInput || !el.modalCidade || !el.modalEstado) {
                return;
            }
            
            // Assume que o endereço está no formato "Rua, Número - Bairro, Cidade - Estado"
            const partes = endereco.split(', ');
            
            if (partes.length >= 3) {
                const ruaNumero = partes[0].split(' ');
                const numero = ruaNumero.pop(); // Último elemento é o número
                const rua = ruaNumero.join(' ');
                
                el.modalRuaInput.value = rua || '';
                el.modalNumeroInput.value = numero || '';
                el.modalBairroInput.value = partes[1] ? partes[1].replace(' -', '') : '';
                
                const cidadeEstado = partes[2] ? partes[2].split(' - ') : [];
                if (cidadeEstado.length >= 2) {
                    el.modalCidade.value = cidadeEstado[0] || '';
                    el.modalEstado.value = cidadeEstado[1] || '';
                }
            }
        },

        // Atualizar UI após Login
        atualizarUIposLogin: function() {
            const el = this.elementos;
            
            if (this.clienteLogado && this.clientePerfil) {
                // Atualizar informações do cliente
                if (el.homeClienteNome) {
                    el.homeClienteNome.textContent = this.clientePerfil.nome || 'Cliente';
                }
                
                if (el.homeEndereco) {
                    el.homeEndereco.innerHTML = this.clientePerfil.endereco ? 
                        `<p style="font-size: 1.1rem; font-weight: bold;">${this.clientePerfil.endereco}</p>` :
                        '<p style="color: #666;">Endereço não cadastrado</p>';
                }
                
                if (el.carrinhoClienteNome) {
                    el.carrinhoClienteNome.textContent = this.clientePerfil.nome || 'Cliente';
                }
                
                if (el.carrinhoEnderecoDisplay && this.clientePerfil.endereco) {
                    el.carrinhoEnderecoDisplay.textContent = this.clientePerfil.endereco;
                    if (el.carrinhoEnderecoInput) {
                        el.carrinhoEnderecoInput.value = this.clientePerfil.endereco;
                    }
                }
                
                // Mostrar navegação mobile
                if (el.mobileBottomNav) {
                    el.mobileBottomNav.style.display = 'flex';
                }
                
                // Mostrar view inicial
                this.mostrarView('view-inicio');
                
            } else {
                // Resetar UI se não estiver logado
                if (el.mobileBottomNav) {
                    el.mobileBottomNav.style.display = 'none';
                }
                this.mostrarView('auth-screen');
            }
        },

        // Mostrar View Específica
        mostrarView: function(viewId) {
            const el = this.elementos;
            
            // Esconder todas as views
            if (el.authScreen) el.authScreen.classList.remove('active');
            if (el.viewInicio) el.viewInicio.classList.remove('active');
            if (el.viewCardapio) el.viewCardapio.classList.remove('active');
            if (el.viewPromocoes) el.viewPromocoes.classList.remove('active');
            if (el.viewCarrinho) el.viewCarrinho.classList.remove('active');
            
            // Mostrar view solicitada
            switch(viewId) {
                case 'auth-screen':
                    if (el.authScreen) el.authScreen.classList.add('active');
                    break;
                case 'view-inicio':
                    if (el.viewInicio) el.viewInicio.classList.add('active');
                    // Atualizar dados sempre que abrir a view de início
                    if (this.clienteLogado) {
                        this.atualizarUIposLogin();
                        if (window.AppRastreamento && window.AppRastreamento.carregarStatusUltimoPedido) {
                            window.AppRastreamento.carregarStatusUltimoPedido();
                        }
                    }
                    break;
                case 'view-cardapio':
                    if (el.viewCardapio) el.viewCardapio.classList.add('active');
                    // Carregar cardápio se necessário
                    if (typeof window.AppCardapio !== 'undefined' && window.AppCardapio.inicializarCardapio) {
                        window.AppCardapio.inicializarCardapio();
                    }
                    break;
                case 'view-promocoes':
                    if (el.viewPromocoes) el.viewPromocoes.classList.add('active');
                    break;
                case 'view-carrinho':
                    if (el.viewCarrinho) el.viewCarrinho.classList.add('active');
                    // Atualizar carrinho
                    if (typeof window.AppCarrinho !== 'undefined' && window.AppCarrinho.atualizarCarrinho) {
                        window.AppCarrinho.atualizarCarrinho();
                    }
                    break;
            }
            
            console.log(`View alterada para: ${viewId}`);
        },

        // Utilitários
        formatarMoeda: function(valor) {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(valor);
        },

        // Verificar se a loja está aberta
        verificarStatusLoja: function() {
            if (!this.configLoja) return false;
            
            const agora = new Date();
            const horaAtual = agora.getHours().toString().padStart(2, '0') + ':' + 
                             agora.getMinutes().toString().padStart(2, '0');
            
            const [horaAbertura, minutoAbertura] = this.configLoja.horario_abertura.split(':').map(Number);
            const [horaFechamento, minutoFechamento] = this.configLoja.horario_fechamento.split(':').map(Number);
            
            const totalMinutosAtual = agora.getHours() * 60 + agora.getMinutes();
            const totalMinutosAbertura = horaAbertura * 60 + minutoAbertura;
            const totalMinutosFechamento = horaFechamento * 60 + minutoFechamento;
            
            return totalMinutosAtual >= totalMinutosAbertura && totalMinutosAtual <= totalMinutosFechamento;
        }
    };

    // Inicializar a aplicação quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.app.init();
        });
    } else {
        window.app.init();
    }

})();