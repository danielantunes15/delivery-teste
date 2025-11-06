class ProdutoManager {
    constructor() {
        this.produtos = []; // Cache de todos os produtos
        this.categorias = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.carregarCategorias();
        await this.carregarProdutos(); // Carrega produtos e renderiza
    }

    bindEvents() {
        // Eventos do Modal (Lógica original mantida)
        const modal = document.getElementById('modalProduto');
        const btnNovo = document.getElementById('btnNovoProduto');
        const btnCancelar = document.getElementById('btnCancelar');
        const closeBtn = document.querySelector('.close');
        const form = document.getElementById('formProduto');
        const fileInput = document.getElementById('foto');

        btnNovo.addEventListener('click', () => this.abrirModal());
        btnCancelar.addEventListener('click', () => this.fecharModal());
        closeBtn.addEventListener('click', () => this.fecharModal());
        
        form.addEventListener('submit', (e) => this.salvarProduto(e));
        fileInput.addEventListener('change', (e) => this.previewImage(e));

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.fecharModal();
            }
        });

        // --- NOVOS EVENTOS ---
        // Lógica das Abas
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Botões
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Conteúdo
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.style.display = 'none';
                    content.classList.remove('active');
                });
                
                const activeContent = document.getElementById(tabId);
                activeContent.style.display = 'block';
                activeContent.classList.add('active');
            });
        });

        // Lógica dos Filtros
        document.getElementById('filtro-categoria').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filtro-status').addEventListener('change', () => this.aplicarFiltros());
        
        // Lógica do Menu Mobile
        const menuToggle = document.getElementById('menuToggle');
        const mainNav = document.getElementById('mainNav');
        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', function() {
                mainNav.classList.toggle('show');
            });
        }
    }

    async carregarCategorias() {
        try {
            this.categorias = await produtoService.getCategorias();
            console.log('Categorias carregadas:', this.categorias);
            
            // Popular select do modal
            this.popularSelectCategorias(document.getElementById('categoria'));
            
            // Popular select do filtro
            this.popularSelectCategorias(document.getElementById('filtro-categoria'), true);

            // Popular tabela de categorias (Nova funcionalidade)
            this.renderizarCategorias();

        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            alert('Erro ao carregar categorias: ' + error.message);
        }
    }

    async carregarProdutos() {
        try {
            this.mostrarLoading();
            // Busca todos os produtos do serviço
            this.produtos = await produtoService.getProdutos(); 
            console.log('Produtos carregados:', this.produtos);
            // Renderiza com base nos filtros atuais
            this.aplicarFiltros(); 
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            alert('Erro ao carregar produtos: ' + error.message);
        }
    }

    mostrarLoading() {
        // ATUALIZADO: Renderiza o loading na tabela
        const container = document.getElementById('produtos-body');
        if (container) {
            container.innerHTML = '<tr><td colspan="6" class="loading">Carregando produtos...</td></tr>';
        }
    }

    // --- FUNÇÃO RENDERIZAR PRODUTOS ATUALIZADA ---
    renderizarProdutos(produtosParaRenderizar) {
        // ATUALIZADO: Renderiza os produtos na <tbody> da tabela
        const container = document.getElementById('produtos-body');
        
        console.log('Produtos para renderizar:', produtosParaRenderizar);

        if (produtosParaRenderizar.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="loading">Nenhum produto encontrado.</td></tr>';
            return;
        }

        container.innerHTML = produtosParaRenderizar.map(produto => `
            <tr>
                <td>
                    ${produto.icone ? ` 
                        <img src="${produto.icone}" alt="${produto.nome}" class="produto-imagem">
                    ` : `
                        <div class="produto-imagem-placeholder">
                            Sem imagem
                        </div>
                    `}
                </td>
                <td>${produto.nome}</td>
                <td>${produto.nome_categoria || 'Sem Categoria'}</td>
                <td>R$ ${parseFloat(produto.preco_venda).toFixed(2)}</td>
                <td>
                    <span class="status-badge ${produto.ativo ? 'active' : 'inactive'}">
                        ${produto.ativo ? 'Disponível' : 'Indisponível'}
                    </span>
                </td>
                <td>
                    <button class="btn-edit" onclick="produtoManager.editarProduto('${produto.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-danger" onclick="produtoManager.excluirProduto('${produto.id}')">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // --- NOVA FUNÇÃO DE FILTRO ---
    aplicarFiltros() {
        const categoriaFiltro = document.getElementById('filtro-categoria').value;
        const statusFiltro = document.getElementById('filtro-status').value;
        
        let produtosFiltrados = this.produtos;

        // Filtra por Categoria
        if (categoriaFiltro !== 'all') {
            produtosFiltrados = produtosFiltrados.filter(p => p.categoria_id === categoriaFiltro);
        }

        // Filtra por Status
        if (statusFiltro !== 'all') {
            const statusBool = statusFiltro === 'true';
            produtosFiltrados = produtosFiltrados.filter(p => p.ativo === statusBool);
        }

        // Re-renderiza a tabela apenas com os produtos filtrados
        this.renderizarProdutos(produtosFiltrados);
    }

    // --- NOVA FUNÇÃO PARA RENDERIZAR CATEGORIAS ---
    renderizarCategorias() {
        const container = document.getElementById('categorias-body');
        if (!container) return;
        
        if (this.categorias.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="loading">Nenhuma categoria cadastrada.</td></tr>';
            return;
        }
        
        container.innerHTML = this.categorias.map(categoria => {
            // Contar quantos produtos existem nessa categoria
            const qtdProdutos = this.produtos.filter(p => p.categoria_id === categoria.id).length;
            
            return `
                <tr>
                    <td>${categoria.nome}</td>
                    <td>${qtdProdutos}</td>
                    <td>
                        <span class="status-badge active">Ativa</span>
                    </td>
                    <td>
                        <button class="btn-edit" onclick="alert('Função de editar categoria em breve!')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-danger" onclick="alert('Função de excluir categoria em breve!')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // --- LÓGICA DO MODAL (ORIGINAL MANTIDA) ---

    abrirModal(produto = null) {
        const modal = document.getElementById('modalProduto');
        const titulo = document.getElementById('modalTitulo');
        const form = document.getElementById('formProduto');
        
        form.reset();
        document.getElementById('previewImage').style.display = 'none';
        document.getElementById('foto').value = '';
        
        // Popular o select de categorias (agora usa uma função)
        this.popularSelectCategorias(document.getElementById('categoria'));
        
        if (produto) {
            titulo.textContent = 'Editar Produto';
            this.preencherFormulario(produto);
        } else {
            titulo.textContent = 'Novo Produto';
            document.getElementById('produtoId').value = '';
        }
        
        modal.style.display = 'block';
    }

    popularSelectCategorias(selectElement, comOpcaoTodas = false) {
        selectElement.innerHTML = ''; // Limpa opções
        
        if (comOpcaoTodas) {
             selectElement.innerHTML = '<option value="all">Todas as categorias</option>';
        } else {
             selectElement.innerHTML = '<option value="">Selecione uma categoria</option>';
        }
        
        this.categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            selectElement.appendChild(option);
        });
    }

    preencherFormulario(produto) {
        document.getElementById('produtoId').value = produto.id;
        document.getElementById('nome').value = produto.nome;
        document.getElementById('descricao').value = produto.descricao || '';
        document.getElementById('preco').value = produto.preco_venda;
        
        const selectCategoria = document.getElementById('categoria');
        selectCategoria.value = produto.categoria_id;
        
        document.getElementById('disponivel').value = produto.ativo ? 'true' : 'false';
        
        if (produto.icone) {
            document.getElementById('previewImage').src = produto.icone;
            document.getElementById('previewImage').style.display = 'block';
        }
    }

    fecharModal() {
        const modal = document.getElementById('modalProduto');
        modal.style.display = 'none';
    }

    async salvarProduto(event) {
        event.preventDefault();
        
        const produtoId = document.getElementById('produtoId').value;
        const fileInput = document.getElementById('foto');
        
        const produto = {
            nome: document.getElementById('nome').value,
            descricao: document.getElementById('descricao').value,
            preco_venda: parseFloat(document.getElementById('preco').value),
            categoria_id: document.getElementById('categoria').value,
            ativo: document.getElementById('disponivel').value === 'true'
        };

        if (!produto.categoria_id) {
            alert('Por favor, selecione uma categoria.');
            return;
        }

        try {
            let produtoSalvo;

            // Lógica de upload de imagem (Original mantida)
            if (fileInput.files[0]) {
                try {
                    console.log('Processando imagem...');
                    const imagemBase64 = await produtoService.uploadImage(fileInput.files[0], produtoId);
                    produto.icone = imagemBase64;
                    console.log('✅ Imagem processada e anexada ao produto');
                } catch (uploadError) {
                    console.error('Erro no processamento da imagem:', uploadError);
                    alert('Produto salvo, mas houve erro ao processar a imagem: ' + uploadError.message);
                }
            }

            if (produtoId) {
                produtoSalvo = await produtoService.updateProduto(produtoId, produto);
            } else {
                produtoSalvo = await produtoService.createProduto(produto);
            }

            this.fecharModal();
            await this.carregarProdutos(); // Recarrega e re-renderiza a tabela
            this.renderizarCategorias(); // Atualiza a contagem de produtos nas categorias
            alert('Produto salvo com sucesso!');

        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert('Erro ao salvar produto: ' + error.message);
        }
    }

    async editarProduto(id) {
        try {
            // Reutiliza o mesmo modal para edição (Lógica original)
            const produto = await produtoService.getProdutoById(id);
            this.abrirModal(produto);
        } catch (error) {
            console.error('Erro ao carregar produto:', error);
            alert('Erro ao carregar produto: ' + error.message);
        }
    }

    async excluirProduto(id) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) {
            return;
        }

        try {
            await produtoService.deleteProduto(id);
            await this.carregarProdutos(); // Recarrega e re-renderiza a tabela
            this.renderizarCategorias(); // Atualiza a contagem de produtos nas categorias
            alert('Produto excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert('Erro ao excluir produto: ' + error.message);
        }
    }

    previewImage(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('previewImage');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
        }
    }
}

// Inicializar o gerenciador de produtos
let produtoManager;
document.addEventListener('DOMContentLoaded', () => {
    produtoManager = new ProdutoManager();
});