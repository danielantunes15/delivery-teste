// js/api.js - Módulo de API (Supabase e Serviços Externos)

(function() {
    
    const supabase = window.supabase;
    const ui = window.AppUI;

    /**
     * Busca as configurações da loja (taxa de entrega, horários).
     */
    async function carregarConfiguracoesLoja() {
        try {
            const { data, error } = await supabase
                .from('config_loja')
                .select('taxa_entrega, tempo_entrega, seg_abertura, seg_fechamento, seg_fechado, ter_abertura, ter_fechamento, ter_fechado, qua_abertura, qua_fechamento, qua_fechado, qui_abertura, qui_fechamento, qui_fechado, sex_abertura, sex_fechamento, sex_fechado, sab_abertura, sab_fechamento, sab_fechado, dom_abertura, dom_fechamento, dom_fechado')
                .eq('id', 1)
                .single();
            
            if (error) throw error;
            console.log("Configurações da loja carregadas.");
            window.app.configLoja = data; // Salva no estado global
        } catch (error) {
            console.error("Erro ao carregar configurações da loja:", error);
            ui.mostrarMensagem('Erro ao carregar status da loja.', 'error');
            // O app continuará com os valores padrão
        }
    }

    /**
     * Busca um cliente pelo número de telefone.
     * @param {string} telefone - O telefone formatado (ex: 5533...).
     * @returns {Promise<object|null>} Os dados do cliente ou null.
     */
    async function buscarClientePorTelefone(telefone) {
        try {
            const { data, error } = await supabase.from('clientes_delivery')
                .select('*')
                .eq('telefone', telefone)
                .limit(1) 
                .maybeSingle(); 
            
            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            ui.mostrarMensagem('Erro ao consultar banco de dados.', 'error');
            return null;
        }
    }
    
    /**
     * Salva um novo cliente no banco de dados.
     * @param {object} dadosCliente - Dados do formulário de cadastro.
     * @returns {Promise<object>} Os dados do novo cliente.
     */
    async function finalizarCadastroNoSupabase(dadosCliente) {
        const { data: novoCliente, error } = await supabase.from('clientes_delivery')
            .insert(dadosCliente)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error("Este número já está cadastrado. Use a tela inicial para Entrar.");
            }
            throw error;
        }
        return novoCliente;
    }

    /**
     * Atualiza o endereço de um cliente existente.
     * @param {string} telefone - Telefone do cliente.
     * @param {string} enderecoCompleto - Novo endereço.
     */
    async function salvarEdicaoEnderecoNoSupabase(telefone, enderecoCompleto) {
        const { error } = await supabase.from('clientes_delivery')
            .update({ endereco: enderecoCompleto })
            .eq('telefone', telefone);
        
        if (error) throw error;
    }

    /**
     * Busca o endereço a partir de um CEP usando a API ViaCEP.
     * @param {string} cep - O CEP para buscar.
     */
    async function buscarCep(cep) {
        const cepLimpo = cep.replace(/\D/g, ''); 
        if (cepLimpo.length !== 8) return;
        ui.mostrarMensagem('Buscando endereço...', 'info');

        const isCadastro = ui.elementos.cadastroForm.style.display === 'block';
        const isModal = ui.elementos.modalEditarEndereco.style.display === 'flex';
        
        let campos = {};

        if (isCadastro) {
            campos = {
                rua: ui.elementos.cadastroRuaInput,
                bairro: ui.elementos.cadastroBairroInput,
                cidade: ui.elementos.cadastroCidadeInput,
                estado: ui.elementos.cadastroEstadoInput,
                numero: ui.elementos.cadastroNumeroInput
            };
        } else if (isModal) {
            campos = {
                rua: ui.elementos.modalRuaInput,
                bairro: ui.elementos.modalBairroInput,
                cidade: ui.elementos.modalCidadeInput,
                estado: ui.elementos.modalEstadoInput,
                numero: ui.elementos.modalNumeroInput
            };
        } else {
            return;
        }

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();
            
            if (data.erro) {
                ui.mostrarMensagem('CEP não encontrado. Digite o endereço manualmente.', 'warning');
                Object.values(campos).forEach(campo => { if(campo.type !== 'hidden') campo.value = ''; });
                campos.rua.focus();
                return;
            }

            campos.rua.value = data.logradouro || '';
            campos.bairro.value = data.bairro || '';
            campos.cidade.value = data.localidade || '';
            campos.estado.value = data.uf || '';

            if (data.logradouro) {
                campos.numero.focus();
            } else {
                campos.rua.focus();
            }
            ui.mostrarMensagem('Endereço preenchido. Confira os dados.', 'success');
        } catch (error) {
            ui.mostrarMensagem('Erro ao buscar o CEP. Preencha manualmente.', 'error');
        }
    }

    /**
     * Carrega as categorias de produtos.
     * @returns {Promise<Array>} Lista de categorias.
     */
    async function carregarCategorias() {
        // Usa a função já existente do supabase-vendas.js
        return await window.vendasSupabase.buscarCategorias();
    }

    /**
     * Carrega todos os produtos ativos.
     * @returns {Promise<Array>} Lista de produtos.
     */
    async function carregarProdutos() {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('ativo', true)
            .order('nome');
        if (error) throw error;
        return data || [];
    }
    
    /**
     * Carrega os produtos "mais pedidos" (lógica de destaque).
     * @returns {Promise<Array>} Lista de produtos em destaque.
     */
    async function carregarMaisPedidos() {
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .eq('ativo', true)
            .order('estoque_atual', { ascending: false }) // Lógica de destaque (mais estoque)
            .limit(5);
        if (error) throw error;
        return data || [];
    }
    
    /**
     * Busca o histórico de pedidos de um cliente.
     * @param {string} telefone - Telefone do cliente.
     * @returns {Promise<Array>} Lista de pedidos.
     */
    async function buscarHistoricoPedidos(telefone) {
        const { data, error } = await supabase.from('pedidos_online')
            .select(`id, created_at, total, forma_pagamento, status, observacoes, telefone_cliente, endereco_entrega, nome_cliente`)
            .eq('telefone_cliente', telefone) 
            .order('created_at', { ascending: false })
            .limit(3); 
        if (error) throw error;
        return data || [];
    }

    /**
     * Busca o status de um pedido específico (para rastreamento).
     * @param {string} pedidoId - ID do pedido.
     * @returns {Promise<object|null>} O pedido ou null.
     */
    async function buscarPedidoParaRastreamento(pedidoId) {
        const { data: pedido, error } = await supabase.from('pedidos_online')
            .select('id, status')
            .eq('id', pedidoId)
            .single();
        if (error || !pedido) return null;
        return pedido;
    }
    
    /**
     * Salva o pedido finalizado no banco.
     * @param {object} dadosPedido - Objeto com dados do pedido.
     * @returns {Promise<object>} O novo pedido criado.
     */
    async function finalizarPedidoNoSupabase(dadosPedido) {
        const { data: novoPedido, error } = await supabase.from('pedidos_online')
            .insert(dadosPedido)
            .select()
            .single();
        if (error) throw error;
        return novoPedido;
    }
    
    /**
     * Atualiza o estoque de um produto.
     * @param {string} produtoId - ID do produto.
     * @param {number} novoEstoque - Nova quantidade em estoque.
     */
    async function atualizarEstoqueNoSupabase(produtoId, novoEstoque) {
        // Usa a função já existente do supabase-vendas.js
        await window.vendasSupabase.actualizarEstoque(produtoId, novoEstoque);
    }
    
    // --- Funções (simuladas) para buscar opções e complementos ---
    // (Estas funções estão prontas para quando você criar as tabelas)
    
    async function buscarOpcoesProduto(produtoId) {
        // SIMULAÇÃO: Esta função buscaria na tabela 'produto_opcoes_grupos'
        // const { data, error } = await supabase
        //     .from('produto_opcoes_grupos')
        //     .select(`*, opcoes:produto_opcoes(*)`)
        //     .eq('produto_id', produtoId);
        // if (error) throw error;
        // return data;
        
        // Retorno mockado (simulado)
        await new Promise(res => setTimeout(res, 200)); // Simula delay da rede
        return []; // Retorna vazio por enquanto
    }
    
    async function buscarComplementosProduto(produtoId) {
        // SIMULAÇÃO: Esta função buscaria na tabela 'produto_complementos'
        // const { data, error } = await supabase
        //     .from('produto_complementos')
        //     .select(`*`)
        //     .eq('produto_id', produtoId);
        // if (error) throw error;
        // return data;
        
        // Retorno mockado (simulado)
        await new Promise(res => setTimeout(res, 200)); // Simula delay da rede
        return []; // Retorna vazio por enquanto
    }


    // Expõe as funções para o objeto global AppAPI
    window.AppAPI = {
        carregarConfiguracoesLoja,
        buscarClientePorTelefone,
        finalizarCadastroNoSupabase,
        salvarEdicaoEnderecoNoSupabase,
        buscarCep,
        carregarCategorias,
        carregarProdutos,
        carregarMaisPedidos,
        buscarHistoricoPedidos,
        buscarPedidoParaRastreamento,
        finalizarPedidoNoSupabase,
        atualizarEstoqueNoSupabase,
        buscarOpcoesProduto,
        buscarComplementosProduto
    };

})();