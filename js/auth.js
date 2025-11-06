// js/auth.js - Sistema de autenticação COMPLETO CORRIGIDO
class SistemaAuth {
    constructor() {
        this.usuarioLogado = null;
        this.carregarUsuarioSalvo();
    }

    // Carregar usuário do sessionStorage
    carregarUsuarioSalvo() {
        try {
            const usuarioSalvo = sessionStorage.getItem('usuarioLogado');
            if (usuarioSalvo) {
                this.usuarioLogado = JSON.parse(usuarioSalvo);
                console.log('✅ Usuário carregado do sessionStorage:', this.usuarioLogado.username);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar usuário:', error);
            this.usuarioLogado = null;
        }
        return this.usuarioLogado;
    }

    // Verificar autenticação
    verificarAutenticacao() {
        return this.carregarUsuarioSalvo();
    }

    // Fazer login - VERSÃO CORRIGIDA
    async fazerLogin(username, senha) {
        try {
            console.log('🔐 Tentando login para:', username);
            
            if (!username || !senha) {
                throw new Error('Usuário e senha são obrigatórios');
            }

            // Gerar hash da senha
            const senhaHash = await this.hashSenha(senha);
            console.log('📋 Hash gerado:', senhaHash);

            // Buscar usuário no banco
            console.log('🔍 Buscando usuário no banco...');
            
            const { data: usuarios, error } = await supabase
                .from('sistema_usuarios')
                .select('*')
                .eq('username', username)
                .eq('ativo', true);

            if (error) {
                console.error('❌ Erro Supabase:', error);
                throw new Error('Erro de conexão com o banco de dados');
            }

            console.log('📊 Usuários encontrados:', usuarios);

            if (!usuarios || usuarios.length === 0) {
                throw new Error('Usuário não encontrado ou inativo');
            }

            const usuario = usuarios[0];
            
            // Verificar senha
            console.log('🔍 Comparando hashes:');
            console.log('   Banco:', usuario.senha_hash);
            console.log('   Local:', senhaHash);
            
            if (usuario.senha_hash !== senhaHash) {
                throw new Error('Senha incorreta');
            }

            // Login bem-sucedido - SALVAR O ID CORRETO DO BANCO
            this.usuarioLogado = {
                id: usuario.id, // ✅ USAR O ID DO BANCO, NÃO DO SUPABASE AUTH
                nome: usuario.nome,
                username: usuario.username,
                tipo: usuario.tipo,
                ativo: usuario.ativo
            };

            sessionStorage.setItem('usuarioLogado', JSON.stringify(this.usuarioLogado));
            console.log('✅ Login realizado com sucesso! ID do usuário:', this.usuarioLogado.id);
            
            return { 
                success: true, 
                usuario: this.usuarioLogado,
                message: 'Login realizado com sucesso!' 
            };

        } catch (error) {
            console.error('❌ Erro no login:', error);
            return { 
                success: false, 
                error: error.message || 'Erro desconhecido no login' 
            };
        }
    }

    // Fazer logout
    fazerLogout() {
        console.log('🚪 Fazendo logout...');
        this.usuarioLogado = null;
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'login.html';
    }

    // Função de hash CORRIGIDA (SEM SALT)
    async hashSenha(senha) {
        try {
            const texto = senha;
            
            const encoder = new TextEncoder();
            const data = encoder.encode(texto);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return hashHex;
            
        } catch (error) {
            console.error('❌ Erro no hash:', error);
            // Fallback
            return btoa(senha);
        }
    }

    // Verificar se é admin - CORREÇÃO CRÍTICA
    isAdmin() {
        if (!this.usuarioLogado) {
            console.log('❌ isAdmin: Usuário não logado');
            return false;
        }
        
        console.log('🔍 Verificando se é admin:', {
            usuario: this.usuarioLogado.username,
            tipo: this.usuarioLogado.tipo,
            tiposValidos: ['administrador', 'admin', 'Administrador', 'ADMINISTRADOR', 'gerente']
        });
        
        // Aceitar múltiplas variações de "administrador"
        const tiposAdmin = ['administrador', 'admin', 'Administrador', 'ADMINISTRADOR', 'gerente', 'supervisor'];
        const isAdmin = tiposAdmin.includes(this.usuarioLogado.tipo);
        
        console.log('✅ Resultado isAdmin:', isAdmin);
        return isAdmin;
    }

    // Verificar autenticação e redirecionar se necessário
    requerAutenticacao() {
        const autenticado = this.verificarAutenticacao();
        console.log('🔐 requerAutenticacao:', autenticado);
        
        if (!autenticado) {
            console.log('❌ Não autenticado, redirecionando para login...');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    requerAdmin() {
        console.log('🛡️ Verificando acesso de administrador...');
        
        if (!this.requerAutenticacao()) {
            console.log('❌ requerAdmin: Não autenticado');
            return false;
        }
        
        const isAdmin = this.isAdmin();
        console.log('🔍 requerAdmin - É admin?', isAdmin);
        
        if (!isAdmin) {
            console.log('❌ Acesso negado - Usuário não é administrador');
            alert('❌ Acesso restrito a administradores');
            window.location.href = 'index.html';
            return false;
        }
        
        console.log('✅ Acesso de administrador permitido');
        return true;
    }

    // NOVO MÉTODO: Verificar se o usuário existe no banco
    async verificarUsuarioNoBanco() {
        if (!this.usuarioLogado || !this.usuarioLogado.id) {
            return false;
        }

        try {
            const { data: usuario, error } = await supabase
                .from('sistema_usuarios')
                .select('id')
                .eq('id', this.usuarioLogado.id)
                .single();

            if (error || !usuario) {
                console.error('❌ Usuário não encontrado no banco:', this.usuarioLogado.id);
                return false;
            }

            console.log('✅ Usuário verificado no banco:', usuario.id);
            return true;
        } catch (error) {
            console.error('❌ Erro ao verificar usuário no banco:', error);
            return false;
        }
    }

    // NOVO MÉTODO: Sincronizar usuário com o banco
    async sincronizarUsuario() {
        if (!this.usuarioLogado) {
            return false;
        }

        try {
            const { data: usuario, error } = await supabase
                .from('sistema_usuarios')
                .select('*')
                .eq('username', this.usuarioLogado.username)
                .single();

            if (error || !usuario) {
                console.error('❌ Usuário não encontrado para sincronização');
                return false;
            }

            // Atualizar dados do usuário logado
            this.usuarioLogado = {
                id: usuario.id,
                nome: usuario.nome,
                username: usuario.username,
                tipo: usuario.tipo,
                ativo: usuario.ativo
            };

            sessionStorage.setItem('usuarioLogado', JSON.stringify(this.usuarioLogado));
            console.log('✅ Usuário sincronizado com banco:', this.usuarioLogado.id);
            return true;

        } catch (error) {
            console.error('❌ Erro ao sincronizar usuário:', error);
            return false;
        }
    }

    // NOVO MÉTODO: Obter usuário atualizado do banco
    async obterUsuarioAtualizado() {
        if (!this.usuarioLogado) {
            return null;
        }

        try {
            const { data: usuario, error } = await supabase
                .from('sistema_usuarios')
                .select('*')
                .eq('id', this.usuarioLogado.id)
                .single();

            if (error || !usuario) {
                console.error('❌ Erro ao obter usuário atualizado:', error);
                return null;
            }

            return usuario;
        } catch (error) {
            console.error('❌ Erro ao obter usuário atualizado:', error);
            return null;
        }
    }

    // NOVO MÉTODO: Forçar tipo de usuário (para debug)
    forcarTipoUsuario(novoTipo) {
        if (!this.usuarioLogado) return false;
        
        console.log('🔄 Forçando tipo de usuário para:', novoTipo);
        this.usuarioLogado.tipo = novoTipo;
        sessionStorage.setItem('usuarioLogado', JSON.stringify(this.usuarioLogado));
        
        console.log('✅ Tipo de usuário atualizado:', this.usuarioLogado);
        return true;
    }
}

// Função global para logout
window.fazerLogoutGlobal = function() {
    if (window.sistemaAuth) {
        window.sistemaAuth.fazerLogout();
    } else {
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'login.html';
    }
};

// Instância global
window.sistemaAuth = new SistemaAuth();

// Funções de debug globais
window.debugAuth = function() {
    console.log('🔍 DEBUG AUTH:', {
        usuario: window.sistemaAuth?.usuarioLogado,
        isAdmin: window.sistemaAuth?.isAdmin(),
        autenticado: window.sistemaAuth?.verificarAutenticacao()
    });
};

window.forcarAdmin = function() {
    if (window.sistemaAuth) {
        window.sistemaAuth.forcarTipoUsuario('administrador');
        console.log('✅ Tipo forçado para administrador');
        location.reload();
    }
};


// Configurar event listener global para botões de logout E NOVO MENU DE PERFIL
document.addEventListener('DOMContentLoaded', function() {
    // --- Lógica de Botões de Logout (Mantida para o caso de outros .btn-logout) ---
    document.querySelectorAll('.btn-logout').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            window.fazerLogoutGlobal();
        });
    });

    // --- NOVO BLOCO: Menu de Perfil na Sidebar ---
    const userProfileToggle = document.getElementById('user-profile-toggle');
    const logoutMenu = document.getElementById('logout-menu');
    const globalLogoutLink = document.getElementById('global-logout-link');
    const sidebarUsername = document.getElementById('sidebar-username');

    if (window.sistemaAuth && window.sistemaAuth.usuarioLogado) {
        const usuario = window.sistemaAuth.usuarioLogado;
        if (sidebarUsername) {
            // Pega o primeiro nome para melhor visualização na sidebar
            const primeiroNome = usuario.nome.split(' ')[0];
            sidebarUsername.textContent = primeiroNome;
        }

        if (userProfileToggle && logoutMenu) {
            // Alterna o menu de logout ao clicar no perfil
            userProfileToggle.addEventListener('click', () => {
                logoutMenu.classList.toggle('show');
                userProfileToggle.classList.toggle('open');
            });

            // Adiciona a funcionalidade de logout ao link no menu flutuante
            if (globalLogoutLink) {
                globalLogoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Garante que o menu feche antes de fazer logout (opcional)
                    logoutMenu.classList.remove('show'); 
                    window.sistemaAuth.fazerLogout();
                });
            }
        }
    } else {
        // Se não estiver logado, esconde o footer do perfil.
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (sidebarFooter) {
            sidebarFooter.style.display = 'none';
        }
    }
    
    // Esconde o menu de logout se clicar fora dele (Comportamento de dropdown)
    document.addEventListener('click', function(event) {
        if (logoutMenu && userProfileToggle && logoutMenu.classList.contains('show')) {
            // Verifica se o clique não foi no botão de toggle e nem dentro do menu
            if (!userProfileToggle.contains(event.target) && !logoutMenu.contains(event.target)) {
                logoutMenu.classList.remove('show');
                userProfileToggle.classList.remove('open');
            }
        }
    });
    // --- FIM DO NOVO BLOCO ---


    // Verificar sincronização do usuário ao carregar a página
    if (window.sistemaAuth && window.sistemaAuth.usuarioLogado) {
        setTimeout(async () => {
            console.log('🔄 Verificando sincronização do usuário...');
            const sincronizado = await window.sistemaAuth.sincronizarUsuario();
            if (!sincronizado) {
                console.warn('⚠️ Usuário não sincronizado com o banco. Algumas funcionalidades podem não funcionar.');
                
                // Tentar obter usuário atualizado
                const usuarioAtualizado = await window.sistemaAuth.obterUsuarioAtualizado();
                if (!usuarioAtualizado) {
                    console.error('❌ Problema grave com usuário. Redirecionando para login...');
                    setTimeout(() => {
                        window.sistemaAuth.fazerLogout();
                    }, 2000);
                }
            } else {
                console.log('✅ Usuário sincronizado com sucesso!');
            }
        }, 1000);
    }
});