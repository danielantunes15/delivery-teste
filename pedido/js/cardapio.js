// js/cardapio.js - Módulo de Cardápio e Opções de Produto (Corrigido)

(function() {

    const ui = window.AppUI;
    const api = window.AppAPI;
    // const app = window.app; // <-- REMOVIDO

    /**
     * Carrega categorias, produtos e destaques.
     */
    async function carregarDadosCardapio() {
        try {
            const [categoriasData, produtosData, maisPedidosData] = await Promise.all([
                api.carregarCategorias(),
                api.carregarProdutos(),
                api.carregarMaisPedidos()
            ]);
            
            // CORREÇÃO: Acessa window.app diretamente
            window.app.categorias = categoriasData;
            window.app.produtos = produtosData;
            
            exibirCategorias();
            exibirProdutos(window.app.produtos); // Exibe todos por padrão
            exibirMaisPedidos(maisPedidosData);

        } catch (error) {
            ui.mostrarMensagem('Erro ao carregar o cardápio: ' + error.message, 'error');
        }
    }

    /**
     * Atualiza o status da loja (Aberto/Fechado) com base nos horários do config.
     */
    function updateStoreStatus() {
        const elementos = ui.elementos;
        if (!elementos.storeStatusIndicator || !elementos.storeStatusText) return;

        const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
        const agora = new Date();
        const diaHoje = diasSemana[agora.getDay()];
        
        // CORREÇÃO: Acessa window.app diretamente
        const configLoja = window.app.configLoja;
        const abertura = configLoja[`${diaHoje}_abertura`];
        const fechamento = configLoja[`${diaHoje}_fechamento`];
        const fechado = configLoja[`${diaHoje}_fechado`];
        
        let lojaAberta = false;
        let horarioTexto = "Fechado hoje";

        if (fechado) {
            lojaAberta = false;
        } else if (abertura && fechamento) {
            horarioTexto = `Horário: ${abertura} - ${fechamento}`;
            const [horaAbertura, minAbertura] = abertura.split(':').map(Number);
            const [horaFechamento, minFechamento] = fechamento.split(':').map(Number);
            
            const dataAbertura = new Date(); dataAbertura.setHours(horaAbertura, minAbertura, 0);
            const dataFechamento = new Date(); dataFechamento.setHours(horaFechamento, minFechamento, 0);

            if (agora >= dataAbertura && agora < dataFechamento) {
                lojaAberta = true;
                const minutosParaFechar = (dataFechamento - agora) / 60000;
                if (minutosParaFechar <= 60) {
                    elementos.storeAttentionBar.style.display = 'block';
                    elementos.storeAttentionBar.querySelector('p').textContent = `⚠️ Fechando em ${Math.ceil(minutosParaFechar)} minutos!`;
                } else {
                    elementos.storeAttentionBar.style.display = 'none';
                }
            } else {
                elementos.storeAttentionBar.style.display = 'none';
            }
        }

        if (lojaAberta) {
            elementos.storeStatusIndicator.className = 'status-indicator open';
            elementos.storeStatusText.textContent = 'Aberto';
            elementos.storeClosedMessage.style.display = 'none';
        } else {
            elementos.storeStatusIndicator.className = 'status-indicator closed';
            elementos.storeStatusText.textContent = 'Fechado';
            elementos.storeClosedMessage.style.display = 'block';
        }
        
        elementos.storeHoursText.textContent = horarioTexto;
        // CORREÇÃO: Acessa window.app diretamente
        window.app.Carrinho.atualizarCarrinho();
    }

    /**
     * Renderiza a lista de categorias.
     */
    function exibirCategorias() { 
        const container = ui.elementos.categoriesScroll;
        if (!container) return;
        container.innerHTML = ''; 
        
        const todos = document.createElement('div');
        todos.className = `category-item active`;
        todos.textContent = 'Todos';
        todos.setAttribute('data-id', 'todos');
        container.appendChild(todos);

        // CORREÇÃO: Acessa window.app diretamente
        window.app.categorias.forEach(categoria => {
            const btn = document.createElement('div');
            btn.className = `category-item`;
            btn.textContent = categoria.nome;
            btn.setAttribute('data-id', categoria.id);
            container.appendChild(btn);
        });
        
        setupCategoryNavigationJS();
    }

    /**
     * Configura os cliques e o scroll suave das categorias.
     */
    function setupCategoryNavigationJS() {
        const categoryItems = document.querySelectorAll('.category-item');
        const productsSectionEl = ui.elementos.productsSection;
        
        categoryItems.forEach(item => {
            item.addEventListener('click', () => {
                const categoryId = item.getAttribute('data-id');
                categoryItems.forEach(cat => cat.classList.remove('active'));
                item.classList.add('active');
                
                const categorySections = document.querySelectorAll('.category-products');

                if (categoryId === 'todos') {
                    categorySections.forEach(section => section.style.display = 'block');
                    productsSectionEl.scrollIntoView({ behavior: 'smooth' });
                    return;
                }
                
                categorySections.forEach(section => section.style.display = 'none');
                const targetSection = document.getElementById(`category-section-${categoryId}`);
                
                if (targetSection) {
                    targetSection.style.display = 'block';
                    setTimeout(() => targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                }
            });
        });
    }

    /**
     * Renderiza a lista de "Mais Pedidos" (Destaques).
     * @param {Array} destaques - Lista de produtos em destaque.
     */
    function exibirMaisPedidos(destaques) {
        const container = ui.elementos.popularScroll;
        if (!container) return;
        container.innerHTML = '';
        
        if (!destaques || destaques.length === 0) {
             container.innerHTML = '<p>Nenhum destaque no momento.</p>';
             return;
        }

        destaques.forEach(produto => {
            const item = document.createElement('div');
            item.className = 'popular-item';
            const imgTag = produto.icone
                ? `<img src="${produto.icone}" alt="${produto.nome}">`
                : `<div class="popular-item-placeholder"><i class="fas fa-cube"></i></div>`;

            item.innerHTML = `
                ${imgTag}
                <h3>${produto.nome}</h3>
                <p>${ui.formatarMoeda(produto.preco_venda)}</p>
            `;
            item.addEventListener('click', () => abrirModalOpcoes(produto));
            container.appendChild(item);
        });
    }

    /**
     * Renderiza a lista principal de produtos, agrupados por categoria.
     * @param {Array} listaParaExibir - A lista de produtos (pode ser filtrada).
     */
    function exibirProdutos(listaParaExibir) {
        const container = ui.elementos.productsSection;
        if (!container) return;
        container.innerHTML = ''; 
        
        // CORREÇÃO: Acessa window.app diretamente
        const produtosAtivos = listaParaExibir || window.app.produtos.filter(p => p.ativo);
        
        const produtosPorCategoria = {};
        produtosAtivos.forEach(produto => {
            const catId = produto.categoria_id || 'sem-categoria';
            // CORREÇÃO: Acessa window.app diretamente
            const categoriaObj = window.app.categorias.find(c => c.id === produto.categoria_id);
            const catNome = categoriaObj?.nome || 'Outros';
            
            if (!produtosPorCategoria[catId]) {
                produtosPorCategoria[catId] = { id: catId, nome: catNome, produtos: [] };
            }
            produtosPorCategoria[catId].produtos.push(produto);
        });
        
        const categoriasOrdenadas = Object.values(produtosPorCategoria).sort((a, b) => a.nome.localeCompare(b.nome));

        if (categoriasOrdenadas.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center;">Nenhum produto encontrado.</p>';
            return;
        }

        categoriasOrdenadas.forEach(categoria => {
            const categorySectionDiv = document.createElement('div');
            categorySectionDiv.className = 'category-products';
            categorySectionDiv.id = `category-section-${categoria.id}`;
            
            let productListHtml = '';
            categoria.produtos.forEach(produto => {
                const esgotado = produto.estoque_atual <= 0;
                const imgTag = produto.icone
                    ? `<img src="${produto.icone}" alt="${produto.nome}">`
                    : `<div class="product-image-placeholder"><i class="fas fa-cube"></i></div>`;
                
                productListHtml += `
                    <div class="product-item ${esgotado ? 'out-of-stock' : ''}" data-id="${produto.id}">
                        <div class="product-info">
                            <h4 class="product-name">${produto.nome}</h4>
                            <p class="product-description">${produto.descricao || 'Sem descrição'}</p>
                            <p class="product-price">${ui.formatarMoeda(produto.preco_venda)}</p>
                        </div>
                        <div class="product-image">
                            ${imgTag}
                            <button class="add-cart" data-id="${produto.id}" ${esgotado ? 'disabled' : ''}>
                                ${esgotado ? '<i class="fas fa-times"></i>' : '+'}
                            </button>
                        </div>
                    </div>
                `;
            });

            categorySectionDiv.innerHTML = `
                <h3 class="category-title">${categoria.nome}</h3>
                <div class="products-list">
                    ${productListHtml}
                </div>
            `;
            container.appendChild(categorySectionDiv);
        });
        
        container.querySelectorAll('.product-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const produtoId = e.currentTarget.getAttribute('data-id');
                // CORREÇÃO: Acessa window.app diretamente
                const produto = window.app.produtos.find(p => p.id === produtoId);
                if (!produto) return;

                if (e.target.classList.contains('add-cart')) {
                    e.stopPropagation();
                    // CORREÇÃO: Acessa window.app diretamente
                    window.app.Carrinho.adicionarAoCarrinho(produto);
                } else if (produto.estoque_atual > 0) {
                    abrirModalOpcoes(produto);
                }
            });
        });
    }

    // --- Funções de Busca e Compartilhamento ---

    function setupShare() {
        if (navigator.share) {
            navigator.share({
                title: 'Confeitaria Doce Criativo',
                text: 'Confira os deliciosos doces da Confeitaria Doce Criativo!',
                url: window.location.href
            }).catch(error => console.log('Erro ao compartilhar:', error));
        } else {
            navigator.clipboard.writeText(window.location.href).then(() => {
                ui.mostrarMensagem('Link copiado para a área de transferência!', 'success');
            });
        }
    }

    function setupSearch() {
        const searchTerm = prompt('O que você está procurando?');
        if (searchTerm && searchTerm.trim() !== '') {
            // CORREÇÃO: Acessa window.app diretamente
            const produtosFiltrados = window.app.produtos.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
            exibirProdutos(produtosFiltrados);
            document.querySelectorAll('.category-item').forEach(cat => cat.classList.remove('active'));
            document.querySelectorAll('.category-products').forEach(section => {
                section.style.display = 'block';
            });
        }
    }

    // --- Lógica do Modal de Opções ---

    async function abrirModalOpcoes(produto) {
        if (produto.estoque_atual <= 0) return;

        // CORREÇÃO: Acessa window.app diretamente
        window.app.produtoSelecionadoModal = produto;
        window.app.precoBaseModal = produto.preco_venda;
        
        const elementos = ui.elementos;
        elementos.opcoesTitulo.textContent = produto.nome;
        elementos.opcoesDescricao.textContent = produto.descricao || '';
        elementos.opcoesContainer.innerHTML = '';
        elementos.complementosContainer.innerHTML = '';
        elementos.opcoesObservacao.value = '';
        elementos.opcoesQuantidadeValor.textContent = '1';

        ui.mostrarMensagem('Carregando opções...', 'info');

        try {
            const [gruposOpcoes, complementos] = await Promise.all([
                api.buscarOpcoesProduto(produto.id),
                api.buscarComplementosProduto(produto.id)
            ]);

            if (gruposOpcoes && gruposOpcoes.length > 0) {
                // ... (lógica de renderização de opções)
            } else {
                elementos.opcoesContainer.innerHTML = '<p style="font-size:0.9rem; color:#888;">Este item não possui opções de escolha.</p>';
            }

            if (complementos && complementos.length > 0) {
                // ... (lógica de renderização de complementos)
            }

            elementos.modalOpcoesProduto.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
                input.addEventListener('change', calcularPrecoModal);
            });
            
            calcularPrecoModal();
            elementos.modalOpcoesProduto.style.display = 'flex';

        } catch (error) {
            console.warn(`Aviso: Não foi possível carregar opções para o produto ${produto.id}. ${error.message}`);
            elementos.opcoesContainer.innerHTML = '';
            elementos.complementosContainer.innerHTML = '';
            calcularPrecoModal();
            elementos.modalOpcoesProduto.style.display = 'flex';
        }
    }

    function calcularPrecoModal() {
        // CORREÇÃO: Acessa window.app diretamente
        let precoCalculado = window.app.precoBaseModal;
        const quantidade = parseInt(ui.elementos.opcoesQuantidadeValor.textContent);

        ui.elementos.modalOpcoesProduto.querySelectorAll('input[type="radio"]:checked').forEach(input => {
            precoCalculado += parseFloat(input.dataset.preco || 0);
        });
        ui.elementos.modalOpcoesProduto.querySelectorAll('input[type="checkbox"]:checked').forEach(input => {
            precoCalculado += parseFloat(input.dataset.preco || 0);
        });
        
        const precoFinal = precoCalculado * quantidade;
        ui.elementos.opcoesPrecoModal.textContent = ui.formatarMoeda(precoFinal);
    }
    
    function adicionarItemComOpcoes() {
        const quantidade = parseInt(ui.elementos.opcoesQuantidadeValor.textContent);
        // CORREÇÃO: Acessa window.app diretamente
        let precoCalculado = window.app.precoBaseModal;
        
        const opcoesSelecionadas = [];
        const complementosSelecionados = [];

        ui.elementos.modalOpcoesProduto.querySelectorAll('input[type="radio"]:checked').forEach(input => {
            precoCalculado += parseFloat(input.dataset.preco || 0);
            opcoesSelecionadas.push({ id: input.value, nome: input.dataset.nome, grupo: input.dataset.grupo, preco: parseFloat(input.dataset.preco || 0) });
        });
        
        ui.elementos.modalOpcoesProduto.querySelectorAll('input[type="checkbox"]:checked').forEach(input => {
            precoCalculado += parseFloat(input.dataset.preco || 0);
            complementosSelecionados.push({ id: input.value, nome: input.dataset.nome, preco: parseFloat(input.dataset.preco || 0) });
        });

        const observacaoItem = ui.elementos.opcoesObservacao.value.trim();
        
        const detalhes = {
            quantidade: quantidade,
            precoFinalItem: precoCalculado,
            opcoes: opcoesSelecionadas,
            complementos: complementosSelecionados,
            observacao: observacaoItem
        };
        
        // CORREÇÃO: Acessa window.app diretamente
        window.app.Carrinho.adicionarAoCarrinho(window.app.produtoSelecionadoModal, detalhes);
        ui.fecharModal(ui.elementos.modalOpcoesProduto);
    }
    
    function aumentarQtdModal() {
        let qtd = parseInt(ui.elementos.opcoesQuantidadeValor.textContent);
        qtd++;
        ui.elementos.opcoesQuantidadeValor.textContent = qtd;
        calcularPrecoModal();
    }
    
    function diminuirQtdModal() {
        let qtd = parseInt(ui.elementos.opcoesQuantidadeValor.textContent);
        if (qtd > 1) {
            qtd--;
            ui.elementos.opcoesQuantidadeValor.textContent = qtd;
            calcularPrecoModal();
        }
    }

    // Expõe as funções para o objeto global AppCardapio
    window.AppCardapio = {
        carregarDadosCardapio,
        updateStoreStatus,
        exibirCategorias,
        exibirProdutos,
        exibirMaisPedidos,
        setupCategoryNavigationJS,
        setupShare,
        setupSearch,
        abrirModalOpcoes,
        calcularPrecoModal,
        adicionarItemComOpcoes,
        aumentarQtdModal,
        diminuirQtdModal
    };

})();