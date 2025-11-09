// js/api.js - Módulo de Comunicação com o Supabase (Corrigido)

(function() {

    // Funções de Comunicação com o Supabase
    // Estas funções são chamadas pelos outros módulos (auth, cardapio, checkout, etc.)

    /**
     * Busca as configurações da loja (taxa, tempo de entrega, horários).
     */
    async function carregarConfiguracoesLoja() {
        try {
            const { data, error } = await window.supabase
                .from('config_loja')
                .select('*')
                .eq('id', 1)
                .single();
            
            if (error) throw error;
            
            console.log("Configurações da loja carregadas:", data);
            window.app.configLoja = data; // Armazena no estado global
            return data;

        } catch (error) {
            console.error("Erro ao carregar configurações da loja:", error);
            window.AppUI.mostrarMensagem('Erro ao carregar status da loja.', 'error');
            // Retorna o padrão em caso de falha
            return window.app.configLoja; 
        }
    }

    /**
     * Busca categorias ativas no banco.
     */
    async function carregarCategorias() {
        try {
            const { data, error } = await window.supabase
                .from('categorias')
                .select('*')
                .eq('ativo', true)
                .order('nome');
                
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            throw new Error('Falha ao buscar categorias.');
        }
    }

    /**
     * Busca produtos ativos no banco.
     */
    async function carregarProdutos() {
        try {
            const { data, error } = await window.supabase
                .from('produtos')
                .select('*')
                .eq('ativo', true)
                .order('nome');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            throw new Error('Falha ao buscar produtos.');
        }
    }

    /**
     * Busca os 5 produtos mais pedidos (simulado pelo estoque).
     */
    async function carregarMaisPedidos() {
        try {
            const { data, error } = await window.supabase
                .from('produtos')
                .select('*')
                .eq('ativo', true)
                .order('estoque_atual', { ascending: false }) // Simulação de "mais pedidos"
                .limit(5);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao carregar mais pedidos:', error);
            throw new Error('Falha ao buscar destaques.');
        }
    }

    /**
     * Busca um cliente pelo número de telefone.
     */
    async function buscarClientePorTelefone(telefone) {
        try {
            const { data, error } = await window.supabase
                .from('clientes_delivery')
                .select('*')
                .eq('telefone', telefone)
                .limit(1) 
                .maybeSingle(); 
            
            if (error && error.code !== 'PGRST116') throw error;
            
            return data || null;
        } catch (error) {
            console.error('Erro ao buscar cliente:', error);
            throw new Error('Erro ao consultar banco de dados.');
        }
    }

    /**
     * Salva um novo cliente no banco (cadastro).
     */
    async function finalizarCadastroNoSupabase(dadosCliente) {
        try {
            const { data: novoCliente, error } = await window.supabase
                .from('clientes_delivery')
                .insert(dadosCliente)
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Violação de chave única
                    throw new Error("Este número já está cadastrado. Use a tela inicial para Entrar.");
                }
                throw error;
            }
            return novoCliente;
        } catch (error) {
            console.error('Erro no cadastro (API):', error);
            throw error; // Repassa o erro para o AppAuth
        }
    }

    /**
     * Atualiza o endereço de um cliente existente.
     */
    async function salvarEdicaoEnderecoNoSupabase(telefone, enderecoCompleto) {
        try {
            const { error } = await window.supabase
                .from('clientes_delivery')
                .update({ endereco: enderecoCompleto })
                .eq('telefone', telefone);
                
            if (error) throw error;
            
        } catch (error) {
            console.error('Erro ao salvar endereço (API):', error);
            throw new Error('Falha ao atualizar endereço.');
        }
    }

    /**
     * Busca opções de um produto (ex: tamanhos, massas).
     */
    async function buscarOpcoesProduto(produtoId) {
        try {
            const { data, error } = await window.supabase
                .from('produto_opcoes_grupos') // Tabela de grupos (ex: "Tamanho")
                .select(`*, opcoes:produto_opcoes(*)`) // Tabela de opções (ex: "Pequeno", "Médio")
                .eq('produto_id', produtoId)
                .order('nome');

            if (error) {
                 // Não é um erro fatal se as tabelas não existirem
                console.warn(`Aviso (API): ${error.message}`);
                return [];
            }
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar opções:', error);
            return [];
        }
    }

    /**
     * Busca complementos de um produto (ex: adicionais).
     */
    async function buscarComplementosProduto(produtoId) {
        try {
            const { data, error } = await window.supabase
                .from('produto_complementos')
                .select(`*`)
                .eq('produto_id', produtoId)
                .order('nome');
                
            if (error) {
                console.warn(`Aviso (API): ${error.message}`);
                return [];
            }
            return data || [];
        } catch (error) {
            console.error('Erro ao buscar complementos:', error);
            return [];
        }
    }

    /**
     * Salva o pedido finalizado na tabela 'pedidos_online'.
     */
    async function finalizarPedidoNoSupabase(dadosPedido) {
        try {
            const { data: novoPedido, error } = await window.supabase
                .from('pedidos_online')
                .insert(dadosPedido)
                .select()
                .single();

            if (error) throw error;
            return novoPedido;
        } catch (error) {
            console.error("Erro ao salvar pedido no Supabase (API):", error);
            throw new Error('Falha ao registrar o pedido no banco.');
        }
    }
    
    /**
     * Atualiza o estoque de um produto.
     */
    async function atualizarEstoqueNoSupabase(produtoId, novoEstoque) {
         try {
            if (window.vendasSupabase && window.vendasSupabase.actualizarEstoque) {
                 // Usa a função do admin (se disponível)
                 await window.vendasSupabase.actualizarEstoque(produtoId, novoEstoque);
            } else {
                 // Fallback
                 const { error } = await window.supabase
                    .from('produtos')
                    .update({ estoque_atual: novoEstoque })
                    .eq('id', produtoId);
                if (error) throw error;
            }
        } catch (error) {
            console.error("Erro ao atualizar estoque (API):", error);
            throw new Error('Falha ao atualizar o estoque do produto.');
        }
    }
    
    /**
     * Busca um pedido específico para iniciar o rastreamento.
     */
    async function buscarPedidoParaRastreamento(pedidoId) {
        try {
            const { data: pedido, error } = await window.supabase
                .from('pedidos_online')
                .select('id, status, created_at')
                .eq('id', pedidoId)
                .single();

            if (error) throw error;
            return pedido;
        } catch (error) {
            console.error("Erro ao buscar pedido para rastreamento (API):", error);
            return null; // Retorna nulo para o rastreamento parar
        }
    }
    
    /**
     * Busca o histórico de pedidos de um cliente.
     */
    async function buscarHistoricoPedidos(telefone, limite = 3) {
        try {
            const { data, error } = await window.supabase
                .from('pedidos_online')
                .select(`id, created_at, total, forma_pagamento, status, observacoes, telefone_cliente, endereco_entrega, nome_cliente`)
                .eq('telefone_cliente', telefone) 
                .order('created_at', { ascending: false })
                .limit(limite); 
                
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Erro ao carregar histórico (API):', error);
            throw new Error('Falha ao buscar histórico de pedidos.');
        }
    }
    
    /**
     * Tenta cancelar um pedido (só funciona se o status for 'novo' ou 'preparando').
     */
    async function cancelarPedidoNoSupabase(pedidoId) {
        try {
            // Tenta atualizar o status para 'cancelado'
            // O update só funcionará se o status atual for 'novo' ou 'preparando'
            const { data, error } = await window.supabase
                .from('pedidos_online')
                .update({ status: 'cancelado' })
                .eq('id', pedidoId)
                .in('status', ['novo', 'preparando'])
                .select(); // Retorna o item atualizado

            if (error) throw error;

            // Se 'data' tiver algo, o cancelamento foi bem-sucedido
            return (data && data.length > 0);
            
        } catch (error) {
            console.error("Erro ao tentar cancelar pedido (API):", error);
            throw new Error('Falha na comunicação para cancelar o pedido.');
        }
    }

    /**
     * Busca dados de CEP no ViaCEP (Função utilitária).
     */
    async function buscarCep(cep) {
        const cepLimpo = cep.replace(/\D/g, ''); 
        if (cepLimpo.length !== 8) return;
        
        const isCadastro = window.AppUI.elementos.cadastroForm.style.display === 'block';
        const isModal = window.AppUI.elementos.modalEditarEndereco.style.display === 'flex';
        
        let campos = {};

        if (isCadastro) {
            campos = {
                rua: window.AppUI.elementos.cadastroRuaInput,
                bairro: window.AppUI.elementos.cadastroBairroInput,
                cidade: window.AppUI.elementos.cadastroCidadeInput,
                estado: window.AppUI.elementos.cadastroEstadoInput,
                numero: window.AppUI.elementos.cadastroNumeroInput
            };
        } else if (isModal) {
            campos = {
                rua: window.AppUI.elementos.modalRuaInput,
                bairro: window.AppUI.elementos.modalBairroInput,
                cidade: window.AppUI.elementos.modalCidadeInput,
                estado: window.AppUI.elementos.modalEstadoInput,
                numero: window.AppUI.elementos.modalNumeroInput
            };
        } else {
            return; // Nenhum formulário ativo
        }

        try {
            window.AppUI.mostrarMensagem('Buscando endereço...', 'info');
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            if (!response.ok) throw new Error('Falha na rede ao buscar CEP.');
            
            const data = await response.json();
            
            if (data.erro) {
                window.AppUI.mostrarMensagem('CEP não encontrado. Digite o endereço manualmente.', 'warning');
            } else {
                campos.rua.value = data.logradouro || '';
                campos.bairro.value = data.bairro || '';
                campos.cidade.value = data.localidade || '';
                campos.estado.value = data.uf || '';
                window.AppUI.mostrarMensagem('Endereço preenchido.', 'success');
                if (data.logradouro) {
                    campos.numero.focus();
                } else {
                    campos.rua.focus();
                }
            }
        } catch (error) {
            console.error("Erro ao buscar CEP (API):", error);
            window.AppUI.mostrarMensagem('Erro ao buscar o CEP. Preencha manualmente.', 'error');
        }
    }


    // Expõe as funções para o objeto global AppAPI
    window.AppAPI = {
        carregarConfiguracoesLoja,
        carregarCategorias,
        carregarProdutos,
        carregarMaisPedidos,
        buscarClientePorTelefone,
        finalizarCadastroNoSupabase,
        salvarEdicaoEnderecoNoSupabase,
        buscarOpcoesProduto,
        buscarComplementosProduto,
        finalizarPedidoNoSupabase,
        atualizarEstoqueNoSupabase,
        buscarPedidoParaRastreamento,
        buscarHistoricoPedidos,
        cancelarPedidoNoSupabase,
        buscarCep
    };

})();