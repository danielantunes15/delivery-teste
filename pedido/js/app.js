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
        carrinhoItens: [], // *** CORRIGIDO (era carrinho) ***
        pedidoAtivoId: null,
        supabaseChannel: null,
        todosPedidosCliente: [],
        
        // *** CORREÇÃO: O objeto 'elementos' foi REMOVIDO daqui. ***
        // Usaremos window.AppUI.elementos como fonte da verdade.

        // Inicialização da Aplicação
        init: function() {
            console.log('Iniciando App Doce Criativo...');
            
            // *** CORREÇÃO: Acessa os elementos do UI.js ***
            const el = window.AppUI.elementos; 
            
            if (!el.authTelefone) {
                console.error("AppUI.elementos não foi populado. Verifique ui.js.");
                return;
            }

            this.inicializarEventListeners();
            this.carregarConfiguracoesIniciais();
            this.verificarLoginAnterior();
        },

        // Verificar se todos os elementos essenciais existem (APENAS DEBUG)
        verificarElementos: function() {
            // Esta função não é mais necessária, pois ui.js é a fonte da verdade.
        },

        // Carregar Configurações Iniciais
        carregarConfiguracoesIniciais: async function() {
            try {
                // Usa a API para carregar e armazenar no estado global (window.app.configLoja)
                await window.AppAPI.carregarConfiguracoesLoja();
                console.log('Configurações da loja carregadas:', this.configLoja);
                // Atualiza o status da loja no cardápio
                window.AppCardapio.updateStoreStatus();
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
                    
                    if (pedidoAtivo) {
                        this.pedidoAtivoId = pedidoAtivo;
                        if (window.AppRastreamento) {
                            window.AppRastreamento.iniciarRastreamento(pedidoAtivo);
                        }
                    } else {
                        if (window.AppRastreamento) {
                            window.AppRastreamento.carregarStatusUltimoPedido();
                        }
                    }
                    
                } catch (e) {
                    console.error('Erro ao recuperar dados do cliente:', e);
                    localStorage.removeItem('clientePerfil');
                    window.AppUI.mostrarView('auth-screen'); // Usa AppUI
                }
            } else {
                window.AppUI.mostrarView('auth-screen'); // Usa AppUI
            }
        },

        // Inicializar Event Listeners
        inicializarEventListeners: function() {
            // *** CORREÇÃO: Usa window.AppUI.elementos ***
            const el = window.AppUI.elementos; 

            // Auth Screen
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
                el.headerV2LoginBtn.addEventListener('click', () => window.AppUI.mostrarView('view-inicio'));
            }

            if (el.headerV2CartBtn) {
                el.headerV2CartBtn.addEventListener('click', () => window.AppUI.mostrarView('view-carrinho'));
            }
            
            // Endereço no Header
            if (el.headerV2AddressBtn) {
                el.headerV2AddressBtn.addEventListener('click', () => window.AppUI.abrirModalEditarEndereco());
            }

            // Navegação Mobile
            if (el.navItems && el.navItems.length > 0) {
                el.navItems.forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        const view = item.getAttribute('data-view');
                        window.AppUI.mostrarView(view); // Usa AppUI
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

            window.addEventListener('click', function(e) {
                if (e.target.classList.contains('modal')) {
                    if (window.AppUI && window.AppUI.fecharModal) {
                        window.AppUI.fecharModal(e.target);
                    }
                }
            });

            // Carrinho (Listeners de checkout estão no checkout.js)
            
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
                // Evento 'input' para busca em tempo real
                el.headerSearchInput.addEventListener('input', (e) => {
                    if (window.AppCardapio && window.AppCardapio.filtrarProdutos) {
                        window.AppCardapio.filtrarProdutos(e.target.value);
                    }
                });
                // Evento 'keydown' para Enter
                el.headerSearchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.toggleBuscaHeader(); // Fecha a busca ao pressionar Enter
                    }
                });
            }

            console.log('Event listeners inicializados com sucesso.');
        },

        // Toggle Busca no Header
        toggleBuscaHeader: function() {
            // *** CORREÇÃO: Usa window.AppUI.elementos ***
            const el = window.AppUI.elementos; 
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
            // *** CORREÇÃO: Usa window.AppUI.elementos ***
            const el = window.AppUI.elementos; 
            
            if (!el.modalRuaInput || !el.modalNumeroInput || !el.modalBairroInput || !el.modalCidade || !el.modalEstado) {
                return;
            }
            
            // Assume "Rua, Número - Bairro, Cidade - Estado"
            const partes = endereco.split(', ');
            
            if (partes.length >= 3) {
                const ruaNumero = partes[0].split(' ');
                const numero = ruaNumero.pop(); 
                const rua = ruaNumero.join(' ');
                
                el.modalRuaInput.value = rua || '';
                el.modalNumeroInput.value = numero || '';
                el.modalBairroInput.value = partes[1] ? partes[1].replace(' -', '') : '';
                
                const cidadeEstado = partes[2] ? partes[2].split(' - ') : [];
                if (cidadeEstado.length >= 2) {
                    el.modalCidade.value = cidadeEstado[0] || '';
                    el.modalEstado.value = cidadeEstado[1] || '';
                }
            } else {
                // Fallback se o formato for inesperado
                el.modalRuaInput.value = endereco;
            }
        },

        // Atualizar UI após Login
        atualizarUIposLogin: function() {
            // *** CORREÇÃO: Usa window.AppUI.elementos ***
            const el = window.AppUI.elementos; 
            
            if (this.clienteLogado && this.clientePerfil) {
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
                
                // Atualiza o endereço no header
                if (el.headerV2AddressText && this.clientePerfil.endereco) {
                    const rua = this.clientePerfil.endereco.split(',')[0];
                    el.headerV2AddressText.textContent = rua;
                } else if (el.headerV2AddressText) {
                    el.headerV2AddressText.textContent = "Cadastrar Endereço";
                }
                
                if (el.mobileBottomNav) {
                    el.mobileBottomNav.style.display = 'flex';
                }
                
                window.AppUI.mostrarView('view-inicio'); // Usa AppUI
                
            } else {
                if (el.mobileBottomNav) {
                    el.mobileBottomNav.style.display = 'none';
                }
                window.AppUI.mostrarView('auth-screen'); // Usa AppUI
            }
        },

        // *** CORREÇÃO: Removido 'mostrarView' daqui, pois agora está em ui.js ***
        // *** CORREÇÃO: Removido 'formatarMoeda' daqui, pois agora está em ui.js ***

        // Verificar se a loja está aberta
        verificarStatusLoja: function() {
            // Esta função foi movida para cardapio.js (updateStoreStatus)
            // e é chamada após carregarConfiguracoesIniciais()
            return true; 
        }
    };

    // Inicializar a aplicação quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Garante que o AppUI exista antes de iniciar o app
            if (window.AppUI) {
                window.app.init();
            } else {
                // Tenta novamente após um curto atraso
                setTimeout(() => window.app.init(), 100);
            }
        });
    } else {
        if (window.AppUI) {
            window.app.init();
        } else {
            setTimeout(() => window.app.init(), 100);
        }
    }

})();