// js/carrinho.js - Módulo de Gerenciamento do Carrinho (Corrigido)

(function() {

    /**
     * Adiciona um item ao carrinho.
     */
    function adicionarAoCarrinho(produto, detalhes = null) {
        if (produto.estoque_atual <= 0) {
            // *** CORREÇÃO: Acessa window.AppUI diretamente ***
            window.AppUI.mostrarMensagem(`Desculpe, ${produto.nome} está esgotado.`, 'error');
            return;
        }
        
        // *** CORREÇÃO: Usa window.app.carrinhoItens ***
        if (!detalhes) {
            const itemExistente = window.app.carrinhoItens.find(item => 
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
                if (produto.estoque_atual > 0) {
                    window.app.carrinhoItens.push({ 
                        produto: produto, 
                        quantidade: 1, 
                        precoFinalItem: produto.preco_venda 
                    });
                } else {
                    window.AppUI.mostrarMensagem(`Produto ${produto.nome} sem estoque disponível.`, 'error');
                    return;
                }
            }
        } else {
            window.app.carrinhoItens.push({
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
        // *** CORREÇÃO: Usa window.app.carrinhoItens ***
        const item = window.app.carrinhoItens[index];
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
        // *** CORREÇÃO: Usa window.app.carrinhoItens ***
        const produtoNome = window.app.carrinhoItens[index].produto.nome;
        if (window.app.carrinhoItens[index].quantidade > 1) {
            window.app.carrinhoItens[index].quantidade -= 1;
        } else {
            window.app.carrinhoItens.splice(index, 1);
        }
        atualizarCarrinho();
        window.AppUI.mostrarMensagem(`${produtoNome} removido da sacola.`, 'info');
    }
    
    /**
     * Limpa o carrinho e reseta o cupom.
     */
    function limparCarrinho() {
        if (!confirm("Tem certeza que deseja limpar toda a sacola?")) return;
        // *** CORREÇÃO: Usa window.app.carrinhoItens ***
        window.app.carrinhoItens = [];
        window.app.cupomAplicado = null;
        if (window.AppUI.elementos.cupomInput) window.AppUI.elementos.cupomInput.value = '';
        atualizarCarrinho();
        window.AppUI.mostrarMensagem("Carrinho limpo!", "info");
    }

    /**
     * Calcula o total do carrinho com desconto e taxa.
     */
    function calcularTotalComAjustes(subTotal) {
        const ajustes = window.app.cupomAplicado;
        const taxaEntrega = window.app.configLoja.taxa_entrega || 0;
        let totalAjustado = subTotal;
        let valorDesconto = 0;
        
        if (ajustes) {
            if (ajustes.tipo === 'percentual') {
                valorDesconto = subTotal * (ajustes.valor / 100);
                totalAjustado -= valorDesconto;
            } else if (ajustes.tipo === 'valor') {
                valorDesconto = ajustes.valor;
                totalAjustado -= valorDesconto;
            }
            totalAjustado = Math.max(0, totalAjustado);
        }
        
        const totalFinal = totalAjustado + taxaEntrega;
        
        return {
            subTotal: subTotal,
            totalAjustado: totalAjustado,
            valorDesconto: valorDesconto,
            totalFinal: totalFinal
        };
    }
    
    /**
     * Atualiza todo o display do carrinho (itens, totais, badges).
     */
    function atualizarCarrinho() {
        let subTotal = 0;
        let totalItens = 0;
        
        // *** CORREÇÃO: Acessa elementos via window.AppUI ***
        const elementos = window.AppUI.elementos;
        const carrinho = window.app.carrinhoItens; // *** CORREÇÃO: Usa carrinhoItens ***
        const formatarMoeda = window.AppUI.formatarMoeda;
        
        carrinho.forEach(item => {
            subTotal += item.precoFinalItem * item.quantidade;
            totalItens += item.quantidade;
        });
        
        const calculo = calcularTotalComAjustes(subTotal);

        if (carrinho.length === 0) {
            elementos.carrinhoItens.innerHTML = `
                <div style="text-align: center; padding: 2rem 0; color: #666;">
                    <i class="fas fa-shopping-cart" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Sua sacola está vazia.</p>
                </div>
            `;
            if (elementos.finalizarPedidoDireto) elementos.finalizarPedidoDireto.disabled = true;
        } else {
            elementos.carrinhoItens.innerHTML = '';
            carrinho.forEach((item, index) => {
                const itemSubtotal = item.precoFinalItem * item.quantidade;
                
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
                        <div class="carrinho-item-nome">${item.produto.nome}</div>
                        <div class="carrinho-item-preco">${formatarMoeda(item.precoFinalItem)} (un)</div>
                        ${opcoesHtml}
                    </div>
                    <div class="carrinho-item-controles">
                        <button class="btn-remover" data-index="${index}"><i class="fas fa-minus"></i></button>
                        <span class="carrinho-item-quantidade">${item.quantidade}</span>
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
            
            // *** CORREÇÃO: Acessa elementos do AppUI ***
            const isLojaAberta = elementos.storeStatusText?.textContent === 'Aberto';
            const isReady = window.app.clienteLogado && isLojaAberta; 

            if (elementos.finalizarPedidoDireto) elementos.finalizarPedidoDireto.disabled = !isReady;
        }
        
        if (elementos.subtotalCarrinho) elementos.subtotalCarrinho.textContent = formatarMoeda(calculo.subTotal);
        if (elementos.taxaEntregaCarrinho) elementos.taxaEntregaCarrinho.textContent = formatarMoeda(window.app.configLoja.taxa_entrega || 0);
        if (elementos.totalCarrinho) elementos.totalCarrinho.textContent = calculo.totalFinal.toFixed(2).replace('.', ',');
        
        if (calculo.valorDesconto > 0) {
            if (elementos.resumoDescontoLinha) elementos.resumoDescontoLinha.style.display = 'flex';
            if (elementos.descontoValorDisplay) elementos.descontoValorDisplay.textContent = `- ${formatarMoeda(calculo.valorDesconto)}`;
            if (elementos.descontoTipoDisplay) elementos.descontoTipoDisplay.textContent = window.app.cupomAplicado.tipo === 'percentual' 
                ? `${window.app.cupomAplicado.valor}%`
                : formatarMoeda(window.app.cupomAplicado.valor);
            if (elementos.cupomMessage) {
                elementos.cupomMessage.textContent = `✅ Cupom ${window.app.cupomAplicado.codigo} aplicado com sucesso.`;
                elementos.cupomMessage.style.color = '#2e7d32';
            }
        } else {
            if (elementos.resumoDescontoLinha) elementos.resumoDescontoLinha.style.display = 'none';
            if (window.app.cupomAplicado === null && elementos.cupomMessage) { // *** CORREÇÃO: Verifica se cupom é null ***
                elementos.cupomMessage.textContent = 'Nenhum cupom aplicado.';
                elementos.cupomMessage.style.color = '#999';
            }
        }


        if (elementos.carrinhoBadge) {
            elementos.carrinhoBadge.textContent = totalItens;
            elementos.carrinhoBadge.style.display = totalItens > 0 ? 'block' : 'none';
        }
        if (elementos.cartCountNav) {
            elementos.cartCountNav.textContent = totalItens;
            elementos.cartCountNav.style.display = totalItens > 0 ? 'flex' : 'none';
        }
        if (elementos.headerV2CartItems) { // *** CORREÇÃO: Nome do elemento do header v2 ***
            elementos.headerV2CartItems.textContent = totalItens === 1 ? '1 item' : `${totalItens} itens`;
        }
        if (elementos.headerV2CartTotal) { // *** CORREÇÃO: Nome do elemento do header v2 ***
            elementos.headerV2CartTotal.textContent = formatarMoeda(calculo.totalFinal);
        }
    }
    
    /**
     * Atualiza a UI do perfil e do carrinho com dados do cliente.
     */
    function atualizarCarrinhoDisplay() {
        // *** CORREÇÃO: Chama a função de UI do AppAuth ***
        if (window.AppAuth && window.AppAuth.atualizarPerfilUI) {
            window.AppAuth.atualizarPerfilUI(); 
        } else {
            // Fallback caso AppAuth não esteja pronto (improvável)
            if (window.app.clienteLogado && window.app.clientePerfil) {
                window.AppUI.elementos.carrinhoClienteNomeDisplay.textContent = window.app.clientePerfil.nome;
                window.AppUI.elementos.carrinhoEnderecoDisplay.textContent = window.app.clientePerfil.endereco;
                window.AppUI.elementos.carrinhoEnderecoInput.value = window.app.clientePerfil.endereco;
            }
        }
        
        const elementos = window.AppUI.elementos;
        if (elementos.tempoEntregaDisplay) elementos.tempoEntregaDisplay.textContent = `${window.app.configLoja.tempo_entrega || 60} min`;
        if (elementos.taxaEntregaStep) elementos.taxaEntregaStep.textContent = window.AppUI.formatarMoeda(window.app.configLoja.taxa_entrega || 0);

        atualizarCarrinho();
    }
    
    /**
     * Limpa o carrinho e reseta os formulários.
     */
    function limparFormularioECarrinho() { 
        // *** CORREÇÃO: Usa window.app.carrinhoItens ***
        window.app.carrinhoItens = [];
        window.app.cupomAplicado = null;
        if (window.AppUI.elementos.cupomInput) window.AppUI.elementos.cupomInput.value = '';
        atualizarCarrinho();
        
        const elementos = window.AppUI.elementos;
        if (elementos.carrinhoEnderecoInput) elementos.carrinhoEnderecoInput.value = window.app.clientePerfil.endereco || '';
        
        // Reseta formulário de pagamento
        elementos.opcoesPagamento.forEach(op => op.classList.remove('selected'));
        const defaultPaymentLabel = elementos.opcoesPagamento[0]; // Pega o primeiro (Dinheiro)
        if (defaultPaymentLabel) {
            defaultPaymentLabel.classList.add('selected');
            const input = defaultPaymentLabel.querySelector('input[type="radio"]');
            if (input) input.checked = true;
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
        limparFormularioECarrinho,
        calcularTotalComAjustes,
        limparCarrinho 
    };

})();