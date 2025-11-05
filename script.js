class ProdutoManager {
    constructor() {
        this.produtos = [];
        this.categorias = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.carregarCategorias();
        await this.carregarProdutos();
    }

    bindEvents() {
        // Modal events
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

        // Fechar modal ao clicar fora
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.fecharModal();
            }
        });
    }

    async carregarCategorias() {
        try {
            this.categorias = await produtoService.getCategorias();
            console.log('Categorias carregadas:', this.categorias);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            alert('Erro ao carregar categorias: ' + error.message);
        }
    }

    async carregarProdutos() {
        try {
            this.mostrarLoading();
            this.produtos = await produtoService.getProdutos();
            console.log('Produtos carregados:', this.produtos);
            this.renderizarProdutos();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            alert('Erro ao carregar produtos: ' + error.message);
        }
    }

    mostrarLoading() {
        const container = document.getElementById('listaProdutos');
        container.innerHTML = '<div class="loading">Carregando produtos...</div>';
    }

    renderizarProdutos() {
        const container = document.getElementById('listaProdutos');
        
        console.log('Produtos para renderizar:', this.produtos);

        if (this.produtos.length === 0) {
            container.innerHTML = '<div class="loading">Nenhum produto cadastrado.</div>';
            return;
        }

        container.innerHTML = this.produtos.map(produto => `
            <div class="produto-card">
                ${produto.icone ? ` 
                    <img src="${produto.icone}" alt="${produto.nome}" class="produto-imagem">
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">Imagem: Base64</div>
                ` : `
                    <div class="produto-imagem" style="background: #ecf0f1; display: flex; align-items: center; justify-content: center; color: #7f8c8d;">
                        Sem imagem
                    </div>
                `}
                
                <div class="produto-nome">${produto.nome}</div>
                <div class="produto-descricao">${produto.descricao || 'Sem descrição'}</div>
                <div class="produto-preco">R$ ${parseFloat(produto.preco_venda).toFixed(2)}</div>
                <div class="produto-categoria">
                    ${produto.nome_categoria || 'Sem Categoria'}
                </div>
                <div class="produto-status ${produto.ativo ? 'status-disponivel' : 'status-indisponivel'}">
                    ${produto.ativo ? '✅ Disponível' : '❌ Indisponível'}
                </div>
                <div class="produto-acoes">
                    <button class="btn-primary" onclick="produtoManager.editarProduto('${produto.id}')">
                        Editar
                    </button>
                    <button class="btn-danger" onclick="produtoManager.excluirProduto('${produto.id}')">
                        Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    abrirModal(produto = null) {
        const modal = document.getElementById('modalProduto');
        const titulo = document.getElementById('modalTitulo');
        const form = document.getElementById('formProduto');
        
        form.reset();
        document.getElementById('previewImage').style.display = 'none';
        document.getElementById('foto').value = '';
        
        // Popular o select de categorias
        this.popularSelectCategorias();
        
        if (produto) {
            titulo.textContent = 'Editar Produto';
            this.preencherFormulario(produto);
        } else {
            titulo.textContent = 'Novo Produto';
            document.getElementById('produtoId').value = '';
        }
        
        modal.style.display = 'block';
    }

    popularSelectCategorias() {
        const selectCategoria = document.getElementById('categoria');
        selectCategoria.innerHTML = '<option value="">Selecione uma categoria</option>';
        
        this.categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            selectCategoria.appendChild(option);
        });
    }

    preencherFormulario(produto) {
        document.getElementById('produtoId').value = produto.id;
        document.getElementById('nome').value = produto.nome;
        document.getElementById('descricao').value = produto.descricao || '';
        document.getElementById('preco').value = produto.preco_venda;
        
        // Selecionar a categoria correta no select
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

        // Validar categoria
        if (!produto.categoria_id) {
            alert('Por favor, selecione uma categoria.');
            return;
        }

        try {
            let produtoSalvo;

            // Upload da imagem se foi selecionada (como Base64)
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
            await this.carregarProdutos();
            alert('Produto salvo com sucesso!');

        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            alert('Erro ao salvar produto: ' + error.message);
        }
    }

    async editarProduto(id) {
        try {
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
            await this.carregarProdutos();
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

// Inicializar o gerenciador de produtos quando a página carregar
let produtoManager;
document.addEventListener('DOMContentLoaded', () => {
    produtoManager = new ProdutoManager();
});