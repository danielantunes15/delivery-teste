// js/carrinho.js - Módulo de Gerenciamento do Carrinho

(function() {

    const ui = window.AppUI;
    const app = window.app; // Acesso ao estado global

    /**
     * Adiciona um item ao carrinho.
     * @param {object} produto - O objeto do produto.
     * @param {object} [detalhes=null] - Detalhes de opções, complementos e observação.
     */
    function adicionarAoCarrinho(produto, detalhes = null) {
        if (produto.estoque_atual <= 0) {
            ui.mostrarMensagem(`Desculpe, ${produto.nome} está esgotado.`, 'error');
            return;
        }

        // Se o item não tem detalhes, tenta agrupar
        if (!detalhes) {
            const itemExistente = app.carrinho.find(item => 
                item.produto.id === produto.id && 
                !item.opcoes && !item.complementos && !item.observacao
            );
            
            if (itemExistente) {
                if (itemExistente.quantidade < produto.estoque_atual) {
                    itemExistente.quantidade += 1;
                } else {
                    ui.mostrarMensagem(`Estoque máximo atingido para ${produto.nome} (${produto.estoque_atual} un.)`, 'warning');
                    return;
                }
            } else {
                app.carrinho.push({ 
                    produto: produto, 
                    quantidade: 1, 
                    precoFinalItem: produto.preco_venda 
                });
            }
        } else {
            // Se tem detalhes, adiciona como um novo item
            app.carrinho.push({
                produto: produto,
                quantidade: detalhes.quantidade,
                precoFinalItem: detalhes.precoFinalItem,
                opcoes: detalhes.opcoes,
                complementos: detalhes.complementos,
                observacao: detalhes.observacao
            });
        }
        
        atualizarCarrinho();
        ui.mostrarMensagem(`${produto.nome} adicionado à sacola!`, 'success');
    }

    /**
     * Aumenta a quantidade de um item no carrinho.
     * @param {number} index - O índice do item no carrinho.
     */
    function aumentarQuantidade(index) {
        const item = app.carrinho[index];
        const produtoEstoque = app.produtos.find(p => p.id === item.produto.id).estoque_atual;
        
        if (item.quantidade < produtoEstoque) {
            item.quantidade += 1;
            atualizarCarrinho();
        } else {
            ui.mostrarMensagem(`Estoque máximo atingido para ${item.produto.nome} (${produtoEstoque} un.)`, 'warning');
        }
    }
    
    /**
     * Remove ou diminui a quantidade de um item no carrinho.
     * @param {number} index - O índice do item no carrinho.
     */
    function removerDoCarrinho(index) {
        const produtoNome = app.carrinho[index].produto.nome;
        if (app.carrinho[index].quantidade > 1) {
            app.carrinho[index].quantidade -= 1;
        } else {
            app.carrinho.splice(index, 1);
        }
        atualizarCarrinho();
        ui.mostrarMensagem(`${produtoNome} removido da sacola.`, 'info');
    }
    
    /**
     * Atualiza todo o display do carrinho (itens, totais, badges).
     */
    function atualizarCarrinho() {
        let subTotal = 0;
        let totalItens = 0;
        const taxaEntrega = app.configLoja.taxa_entrega || 0;
        const elementos = ui.elementos;
            
        if (app.carrinho.length === 0) {
            elementos.carrinhoItens.innerHTML = `<p style="text-align: center; color: #666;">Sua sacola está vazia.</p>`;
        } else {
            elementos.carrinhoItens.innerHTML = '';
            app.carrinho.forEach((item, index) => {
                const itemSubtotal = item.precoFinalItem * item.quantidade;
                subTotal += itemSubtotal;
                totalItens += item.quantidade; 
                
                let opcoesHtml = '';
                if (item.opcoes || item.complementos || item.observacao) {
                    opcoesHtml += '<div class="carrinho-item-opcoes">';
                    if(item.opcoes && item.opcoes.length > 0) {
                        item.opcoes.forEach(op => {
                            opcoesHtml += `<p><strong>${op.grupo}:</strong> ${op.nome}</p>`;
                        });
                    }
                    if(item.complementos && item.complementos.length > 0) {
                        opcoesHtml += `<p><strong>Adicionais:</strong> ${item.complementos.map(c => c.nome).join(', ')}</p>`;
                    }
                    if(item.observacao) {
                        opcoesHtml += `<p><strong>Obs:</strong> ${item.observacao}</p>`;
                    }
                    opcoesHtml += '</div>';
                }

                const itemElement = document.createElement('div');
                itemElement.className = 'carrinho-item';
                // Mostra a quantidade no nome do item
                itemElement.innerHTML = `
                    <div class="carrinho-item-info">
                        <div class="carrinho-item-nome">${item.quantidade}x ${item.produto.nome}</div>
                        <div class="carrinho-item-preco">${ui.formatarMoeda(item.precoFinalItem)} (un)</div>
                        ${opcoesHtml}
                    </div>
                    <div class="carrinho-item-controles">
                        <button class="btn-remover" data-index="${index}"><i class="fas fa-minus"></i></button>
                        <button class="btn-adicionar-carrinho" data-index="${index}"><i class="fas fa-plus"></i></button>
                    </div>
                    <div class="carrinho-item-subtotal">
                        ${ui.formatarMoeda(itemSubtotal)}
                    </div>
                `;
                elementos.carrinhoItens.appendChild(itemElement);
            });
            
            // Adiciona listeners aos botões de +/-
            elementos.carrinhoItens.querySelectorAll('.btn-remover').forEach(btn => btn.addEventListener('click', function() {
                removerDoCarrinho(parseInt(this.getAttribute('data-index')));
            }));
            elementos.carrinhoItens.querySelectorAll('.btn-adicionar-carrinho').forEach(btn => btn.addEventListener('click', function() {
                aumentarQuantidade(parseInt(this.getAttribute('data-index')));
            }));
        }

        const totalFinal = subTotal + taxaEntrega;
        
        // Atualiza o resumo do carrinho
        elementos.subtotalCarrinho.textContent = ui.formatarMoeda(subTotal);
        elementos.taxaEntregaCarrinho.textContent = ui.formatarMoeda(taxaEntrega);
        elementos.totalCarrinho.textContent = totalFinal.toFixed(2).replace('.', ',');
        
        // Verifica se está logado e se a loja está aberta
        const isLojaAberta = elementos.storeStatusText.textContent === 'Aberto';
        const isReady = app.carrinho.length > 0 && app.clienteLogado && isLojaAberta; 
        
        if (elementos.finalizarDiretoBtn) {
            elementos.finalizarDiretoBtn.disabled = !isReady;
        }
        if (!isLojaAberta && app.carrinho.length > 0) {
            ui.mostrarMensagem('A loja está fechada. Não é possível finalizar o pedido.', 'warning');
        }
        
        // Atualiza badges
        if (elementos.carrinhoBadge) {
            elementos.carrinhoBadge.textContent = totalItens;
            elementos.carrinhoBadge.style.display = totalItens > 0 ? 'block' : 'none';
        }
        if (elementos.cartCountNav) {
            elementos.cartCountNav.textContent = totalItens;
            elementos.cartCountNav.style.display = totalItens > 0 ? 'flex' : 'none';
        }
    }
    
    /**
     * Atualiza a UI do perfil e do carrinho com dados do cliente.
     */
    function atualizarCarrinhoDisplay() {
        app.Auth.atualizarPerfilUI(); 
        atualizarCarrinho();
    }
    
    /**
     * Limpa o carrinho e reseta os formulários.
     */
    function limparFormularioECarrinho() { 
        app.carrinho = [];
        atualizarCarrinho();
        
        const elementos = ui.elementos;
        if (elementos.carrinhoEnderecoInput) elementos.carrinhoEnderecoInput.value = app.clientePerfil.endereco || '';
        if (elementos.cadastroForm) elementos.cadastroForm.reset();
        
        document.querySelectorAll('.opcoes-pagamento input[name="pagamento"]').forEach(input => input.checked = false);
        const defaultPayment = document.querySelector('.opcoes-pagamento input[value="Dinheiro"]');
        if(defaultPayment) defaultPayment.checked = true;
        
        elementos.opcoesPagamento.forEach(op => op.classList.remove('selected'));
        const defaultPaymentLabel = document.querySelector('.opcoes-pagamento .pagamento-opcao');
        if (defaultPaymentLabel) {
            defaultPaymentLabel.classList.add('selected');
        }
        
        if (elementos.pedidoObservacoes) elementos.pedidoObservacoes.value = ''; 
        if (elementos.trocoParaInput) elementos.trocoParaInput.value = ''; 
    }

    // Expõe as funções para o objeto global AppCarrinho
    window.AppCarrinho = {
        adicionarAoCarrinho,
        aumentarQuantidade,
        removerDoCarrinho,
        atualizarCarrinho,
        atualizarCarrinhoDisplay,
        limparFormularioECarrinho
    };

})();