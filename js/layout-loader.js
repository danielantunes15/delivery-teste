// js/layout-loader.js
// Este script substitui a necessidade de ter o HTML da sidebar e header em todas as páginas,
// bem como os scripts duplicados de menu, relógio e perfil.

// -----------------------------------------------------------------
// 1. DEFINIÇÃO DOS LINKS DE NAVEGAÇÃO
// Para adicionar/remover/mudar um link, mexa apenas aqui.
// -----------------------------------------------------------------
const navLinks = [
    { href: "index.html", icon: "fa-shopping-cart", text: "Vendas" },
    { href: "delivery.html", icon: "fa-motorcycle", text: "Delivery" },
    { href: "caixa-fechamento.html", icon: "fa-cash-register", text: "Caixa" },
    { href: "encomendas.html", icon: "fa-receipt", text: "Encomendas" },
    { href: "producao.html", icon: "fa-sitemap", text: "Produção" },
    { href: "estoque.html", icon: "fa-boxes", text: "Estoque" },
    { href: "relatorios.html", icon: "fa-chart-bar", text: "Relatórios" },
    { href: "administracao.html", icon: "fa-cog", text: "Administração" },
    { href: "contas-a-pagar.html", icon: "fa-chart-line", text: "Gerencial" }
];

// -----------------------------------------------------------------
// 2. TEMPLATES HTML
// -----------------------------------------------------------------

/**
 * Gera o HTML da Sidebar (Menu Lateral)
 * @param {string} currentPage - O nome do arquivo atual (ex: "index.html")
 */
function getSidebarHTML(currentPage) {
    const linksHTML = navLinks.map(link => `
        <a href="${link.href}" class="nav-link ${link.href === currentPage ? 'active' : ''}">
            <i class="fas ${link.icon}"></i>
            <span>${link.text}</span>
        </a>
    `).join('');

    return `
    <div id="mainSidebar" class="sidebar">
         <div class="sidebar-header">
            <h1 class="logo">Doce Criativo</h1>
            <p>Sistema de Gestão</p>
         </div>
         
         <nav class="nav" id="mainNav">
            ${linksHTML}
         </nav>
         
         <div class="sidebar-footer">
            <div class="logout-menu" id="logout-menu">
                <a href="#" id="global-logout-link" class="logout-link">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Sair do Sistema</span>
                </a>
            </div>
            <div class="user-profile" id="user-profile-toggle">
                <i class="fas fa-user-circle user-avatar"></i>
                <span id="sidebar-username">Carregando...</span>
                <i class="fas fa-chevron-up toggle-icon"></i>
            </div>
        </div>
    </div>
    <div id="sidebarOverlay" class="sidebar-overlay"></div>
    `;
}

/**
 * Gera o HTML do Header (Cabeçalho Superior)
 */
function getHeaderHTML() {
    // Pega o título da tag <title> do HTML
    const pageTitle = document.title.split('-')[0].trim() || 'Dashboard';

    return `
    <header class="header">
        <div class="container">
            <div class="header-content">
                <button class="menu-toggle" id="menuToggle"><i class="fas fa-bars"></i></button>
                
                <h1 class="logo page-title-formatted" id="page-title-header">
                    ${pageTitle}
                </h1>
                
                <div class="header-right-info">
                    <span id="header-relogio" class="info-item-relogio">--:--</span>
                    <span id="status-delivery-icon" class="info-item-icon" title="Status dos Pedidos Online">
                        <i class="fas fa-bell"></i>
                    </span>
                </div>
            </div>
        </div>
    </header>
    `;
}

// -----------------------------------------------------------------
// 3. LÓGICA DO LAYOUT (Funções que estavam duplicadas)
// -----------------------------------------------------------------

/**
 * Lógica do Relógio e Status (era do header-data.js)
 */
let totalPedidosNovos = 0; // Cache

const formatarTituloHeader = () => {
    // A tag H1 tem o nome da página
    const headerH1 = document.getElementById('page-title-header');
    if (headerH1) {
        // Encontra o ícone do link ativo para usar no header
        const activeLink = navLinks.find(link => link.href === (window.location.pathname.split('/').pop() || 'index.html'));
        const iconClass = activeLink ? activeLink.icon : 'fa-chart-line';
        
        headerH1.innerHTML = `<i class="fas ${iconClass}"></i> <span>${headerH1.textContent.trim()}</span>`;
    }
};

const atualizarRelogioEStatus = async () => {
    const relogioElement = document.getElementById('header-relogio');
    const statusDeliveryElement = document.getElementById('status-delivery-icon');

    if (relogioElement) {
        const agora = new Date();
        const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); 
        relogioElement.textContent = horaFormatada;
    }

    if (statusDeliveryElement && window.atualizarStatusHeaderDelivery) {
        try {
            await window.atualizarStatusHeaderDelivery();
            
            let statusIcone = 'fa-check-circle';
            let statusCor = '#28a745';
            let statusTitulo = 'Sem pedidos novos';

            if (totalPedidosNovos > 0) {
                statusIcone = 'fa-exclamation-circle';
                statusCor = '#ff9800';
                statusTitulo = `${totalPedidosNovos} Pedido(s) Novo(s)!`;
            }
            
            statusDeliveryElement.className = `fas ${statusIcone}`;
            statusDeliveryElement.style.color = statusCor;
            statusDeliveryElement.title = statusTitulo;

            let badgeHtml = '';
            if (totalPedidosNovos > 0) {
                badgeHtml = `<span class="delivery-badge" style="background: #f44336; color: white; border-radius: 50%; font-size: 0.7rem; padding: 2px 5px; position: absolute; top: -5px; right: -5px;">${totalPedidosNovos}</span>`;
            }
            statusDeliveryElement.innerHTML = badgeHtml;

        } catch (error) {
            console.error("Erro ao atualizar status do delivery no header:", error);
            statusDeliveryElement.className = 'fas fa-plug';
            statusDeliveryElement.style.color = '#6c757d';
            statusDeliveryElement.title = 'Erro de Conexão Delivery';
        }
    }
};

/**
 * Lógica do Menu Hamburger (era inline no HTML)
 */
function initSidebarToggle() {
    const menuToggle = document.getElementById('menuToggle');
    const mainSidebar = document.getElementById('mainSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    const toggleSidebar = () => {
        mainSidebar.classList.toggle('show');
        sidebarOverlay.style.display = mainSidebar.classList.contains('show') ? 'block' : 'none';
    };

    if (menuToggle && mainSidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar); 
    }
}

/**
 * Lógica do Menu de Perfil (era do auth.js)
 */
function initSidebarFooter() {
    const userProfileToggle = document.getElementById('user-profile-toggle');
    const logoutMenu = document.getElementById('logout-menu');
    const globalLogoutLink = document.getElementById('global-logout-link');
    const sidebarUsername = document.getElementById('sidebar-username');

    if (window.sistemaAuth && window.sistemaAuth.usuarioLogado) {
        const usuario = window.sistemaAuth.usuarioLogado;
        if (sidebarUsername) {
            const primeiroNome = usuario.nome.split(' ')[0];
            sidebarUsername.textContent = primeiroNome;
        }

        if (userProfileToggle && logoutMenu) {
            userProfileToggle.addEventListener('click', () => {
                logoutMenu.classList.toggle('show');
                userProfileToggle.classList.toggle('open');
            });

            if (globalLogoutLink) {
                globalLogoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    logoutMenu.classList.remove('show'); 
                    window.sistemaAuth.fazerLogout();
                });
            }
        }
    } else {
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (sidebarFooter) sidebarFooter.style.display = 'none';
    }
    
    document.addEventListener('click', function(event) {
        if (logoutMenu && userProfileToggle && logoutMenu.classList.contains('show')) {
            if (!userProfileToggle.contains(event.target) && !logoutMenu.contains(event.target)) {
                logoutMenu.classList.remove('show');
                userProfileToggle.classList.remove('open');
            }
        }
    });
}

// -----------------------------------------------------------------
// 4. FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO
// -----------------------------------------------------------------
function initLayout() {
    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    const headerPlaceholder = document.getElementById('header-placeholder');
    
    if (!sidebarPlaceholder || !headerPlaceholder) {
        console.error("Placeholders do layout não encontrados. O layout não será carregado.");
        return;
    }

    // Identifica a página atual
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Injeta o HTML
    sidebarPlaceholder.innerHTML = getSidebarHTML(currentPage);
    headerPlaceholder.innerHTML = getHeaderHTML();

    // Ativa toda a lógica
    initSidebarToggle();
    initSidebarFooter();
    
    // Lógica do header-data.js
    formatarTituloHeader();
    atualizarRelogioEStatus();
    setInterval(atualizarRelogioEStatus, 10000); // Atualiza a cada 10 seg
}

// Dispara a inicialização do layout quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initLayout);