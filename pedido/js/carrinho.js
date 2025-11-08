// js/carrinho.js - Módulo de Gerenciamento do Carrinho (Corrigido)

(function() {

    // const ui = window.AppUI; // <-- REMOVIDO

    /**
     * Adiciona um item ao carrinho.
     */
    function adicionarAoCarrinho(produto, detalhes = null) {
        if (produto.estoque_atual <= 0) {
            // CORREÇÃO: Acessa window.AppUI diretamente
            window.AppUI.mostrarMensagem(`Desculpe, ${produto.nome} está esgotado.`, 'error');
            return;
        }

        if (!detalhes) {
            const itemExistente = window.app.carrinho.find(item => 
                item.produto.id === produto.id && 
                !item.opcoes && !item.complementos && !item.observacao
            );
            
            if (itemExistente) {
                if (itemExistente.quantidade < produto.estoque_atual) {
                    itemExistente.quantidade += 1;
                } else {
                    window.AppUI.mostrarMensagem(`Estoque máximo atingido para ${produto.nome} (${produto.estoque_atual} un.)`, 'warning');
                    return;
                }
            } else {
                window.app.carrinho.push({ 
                    produto: produto, 
                    quantidade: 1, 
                    precoFinalItem: produto.preco_venda 
                });
            }
        } else {
            window.app.carrinho.push({
                produto: produto,
                quantidade: detalhes.quantidade,
                precoFinalItem: detalhes.precoFinalItem,
                opcoes: detalhes.opcoes,
                complementos: detalhes.complementos,
                observacao: detalhes.observacao
            });
        }
        
        atualizarCarrinho();
        window.AppUI.mostrarMensagem(`${produto.nome} adicionado à sacola!`, 'success');
    }

    /**
     * Aumenta a quantidade de um item no carrinho.
     */
    function aumentarQuantidade(index) {
        const item = window.app.carrinho[index];
        const produtoEstoque = window.app.produtos.find(p => p.id === item.produto.id).estoque_atual;
        
        if (item.quantidade < produtoEstoque) {
            item.quantidade += 1;
            atualizarCarrinho();
        } else {
            window.AppUI.mostrarMensagem(`Estoque máximo atingido para ${item.produto.nome} (${produtoEstoque} un.)`, 'warning');
        }
    }
    
    /**
     * Remove ou diminui a quantidade de um item no carrinho.
     */
    function removerDoCarrinho(index) {
        const produtoNome = window.app.carrinho[index].produto.nome;
        if (window.app.carrinho[index].quantidade > 1) {
            window.app.carrinho[index].quantidade -= 1;
        } else {
            window.app.carrinho.splice(index, 1);
        }
        atualizarCarrinho();
        window.AppUI.mostrarMensagem(`${produtoNome} removido da sacola.`, 'info');
    }
    
    /**
     * Atualiza todo o display do carrinho (itens, totais, badges).
     */
    function atualizarCarrinho() {
        let subTotal = 0;
        let totalItens = 0;
        // CORREÇÃO: Acessa window.app e window.AppUI diretamente
        const taxaEntrega = window.app.configLoja.taxa_entrega || 0;
        const elementos = window.AppUI.elementos;
        const carrinho = window.app.carrinho;
        const formatarMoeda = window.AppUI.formatarMoeda;
            
        if (carrinho.length === 0) {
            elementos.carrinhoItens.innerHTML = `<p style="text-align: center; color: #666;">Sua sacola está vazia.</p>`;
        } else {
            elementos.carrinhoItens.innerHTML = '';
            carrinho.forEach((item, index) => {
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
                itemElement.innerHTML = `
                    <div class="carrinho-item-info">
                        <div class="carrinho-item-nome">${item.quantidade}x ${item.produto.nome}</div>
                        <div class="carrinho-item-preco">${formatarMoeda(item.precoFinalItem)} (un)</div>
                        ${opcoesHtml}
                    </div>
                    <div class="carrinho-item-controles">
                        <button class="btn-remover" data-index="${index}"><i class="fas fa-minus"></i></button>
                        <button class="btn-adicionar-carrinho" data-index="${index}"><i class="fas fa-plus"></i></button>
                    </div>
                    <div class="carrinho-item-subtotal">
                        ${formatarMoeda(itemSubtotal)}
                    </div>
                `;
                elementos.carrinhoItens.appendChild(itemElement);
            });
            
            elementos.carrinhoItens.querySelectorAll('.btn-remover').forEach(btn => btn.addEventListener('click', function() {
                removerDoCarrinho(parseInt(this.getAttribute('data-index')));
            }));
            elementos.carrinhoItens.querySelectorAll('.btn-adicionar-carrinho').forEach(btn => btn.addEventListener('click', function() {
                aumentarQuantidade(parseInt(this.getAttribute('data-index')));
            }));
        }

        const totalFinal = subTotal + taxaEntrega;
        
        elementos.subtotalCarrinho.textContent = formatarMoeda(subTotal);
        elementos.taxaEntregaCarrinho.textContent = formatarMoeda(taxaEntrega);
        elementos.totalCarrinho.textContent = totalFinal.toFixed(2).replace('.', ',');
        
        const isLojaAberta = elementos.storeStatusText.textContent === 'Aberto';
        const isReady = carrinho.length > 0 && window.app.clienteLogado && isLojaAberta; 
        
        if (elementos.finalizarDiretoBtn) {
            elementos.finalizarDiretoBtn.disabled = !isReady;
        }
        if (!isLojaAberta && carrinho.length > 0) {
            window.AppUI.mostrarMensagem('A loja está fechada. Não é possível finalizar o pedido.', 'warning');
        }
        
        if (elementos.carrinhoBadge) {
            elementos.carrinhoBadge.textContent = totalItens;
            elementos.carrinhoBadge.style.display = totalItens > 0 ? 'block' : 'none';
        }
        if (elementos.cartCountNav) {
            elementos.cartCountNav.textContent = totalItens;
            elementos.cartCountNav.style.display = totalItens > 0 ? 'flex' : 'none';
        }

        /* --- INÍCIO DA ALTERAÇÃO: Atualizar Header Cart v2 --- */
        if (elementos.headerCartItems) { // ID: header-v2-cart-items
            elementos.headerCartItems.textContent = totalItens === 1 ? '1 item' : `${totalItens} itens`;
        }
        if (elementos.headerCartTotal) { // ID: header-v2-cart-total
            elementos.headerCartTotal.textContent = formatarMoeda(totalFinal);
        }
        /* --- FIM DA ALTERAÇÃO --- */
    }
    
    /**
     * Atualiza a UI do perfil e do carrinho com dados do cliente.
     */
    function atualizarCarrinhoDisplay() {
        window.app.Auth.atualizarPerfilUI(); 
        atualizarCarrinho();
    }
    
    /**
     * Limpa o carrinho e reseta os formulários.
     */
    function limparFormularioECarrinho() { 
        window.app.carrinho = [];
        atualizarCarrinho();
        
        const elementos = window.AppUI.elementos;
        if (elementos.carrinhoEnderecoInput) elementos.carrinhoEnderecoInput.value = window.app.clientePerfil.endereco || '';
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