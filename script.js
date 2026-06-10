// VARIÁVEL IMPORTANTE: Cole aqui o link da sua planilha JSON
const SHEET_JSON_URL = 'https://zelo-api-proxy.tryatsm.workers.dev/';

let allProducts = []; // Para guardar todos os produtos carregados

// Função para buscar os produtos da planilha
async function loadProducts() {
    try {
        const response = await fetch(SHEET_JSON_URL);
        const data = await response.json();
        
        // Converte os dados organizados incluindo a nova coluna row[9] de Cliques
        allProducts = data.values.slice(1).map(row => ({
            id: row[0],
            nome: row[1],
            preco: row[2],
            precoPix: row[3],
            desconto: row[4],
            linkImagem: row[5],
            linkAfiliado: row[6],
            tags: row[7] ? row[7].toLowerCase() : '',
            descricao: row[8] ? row[8] : '',
            cliques: row[9] ? parseInt(row[9]) || 0 : 0 // Lê a 10ª coluna (Coluna J)
        }));

        // ALGORITMO: Ordena a lista deixando os que têm mais cliques no topo automaticamente
        allProducts.sort((a, b) => b.cliques - a.cliques);

        renderProducts(allProducts); // Mostra os produtos já ordenados
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        document.getElementById('product-grid').innerHTML = '<p style="color: red; text-align: center;">Erro ao carregar produtos.</p>';
    }
}

// Função executada quando o usuário clica no produto
function realizarClique(id, linkAfiliado) {
    // Abre o link de afiliado imediatamente em outra aba para o cliente não esperar
    window.open(linkAfiliado, '_blank');

    // Envia em segundo plano o aviso para a sua API registrar o clique na planilha
    fetch(`${SHEET_JSON_URL}?id=${id}`, { method: 'POST', mode: 'no-cors' })
        .catch(err => console.error('Erro ao registrar clique na planilha:', err));

    // SUPER RESPONSIVIDADE: Atualiza o contador na tela na mesma hora!
    const produtoClicado = allProducts.find(p => p.id == id);
    if (produtoClicado) {
        produtoClicado.cliques++; // Soma o clique localmente
        allProducts.sort((a, b) => b.cliques - a.cliques); // Reorganiza a fila colocando o mais clicado no topo
        renderProducts(allProducts); // Recarrega o visual dos cards atualizado
    }
}

// Função para criar o HTML de cada produto e mostrar na tela
function renderProducts(productsToRender) {
    const grid = document.getElementById('product-grid');
    const noResults = document.getElementById('no-results');
    grid.innerHTML = ''; // Limpa o grid

    if (productsToRender.length === 0) {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
        productsToRender.forEach(product => {
            
            // Lógica de Preços Condicionais mantida intacta
            let oldPriceHTML = '';
            let currentPriceValue = '';

            if (product.desconto && product.preco) {
                oldPriceHTML = `<span class="old-price">R$${product.preco}</span><br>`;
                currentPriceValue = product.precoPix;
            } else {
                oldPriceHTML = '';
                currentPriceValue = product.precoPix ? product.precoPix : product.preco;
            }

            const pixHTML = product.precoPix ? `<p class="pix-price">no Pix</p>` : '';
            
            // Exibe o contador visual se o produto tiver pelo menos 1 clique
            const clicksHTML = product.cliques > 0 ? `<p class="product-clicks">🔥 ${product.cliques} acessos</p>` : '';

            const cardHTML = `
                <div class="product-card" onclick="realizarClique('${product.id}', '${product.linkAfiliado}')">
                    ${product.desconto ? `<span class="discount-badge">-${product.desconto}%</span>` : ''}
                    <img src="${product.linkImagem}" alt="${product.nome}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-title">${product.nome}</h3>
                        ${product.descricao ? `<p class="product-description">${product.descricao}</p>` : ''}
                        ${clicksHTML}
                        <div class="price-row">
                            ${oldPriceHTML}
                            <span class="current-price">R$${currentPriceValue}</span>
                        </div>
                        ${pixHTML}
                    </div>
                </div>
            `;
            grid.innerHTML += cardHTML;
        });
    }
}

// Função de Pesquisa
function handleSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    const filteredProducts = allProducts.filter(product => 
        product.nome.toLowerCase().includes(searchTerm) || 
        product.tags.includes(searchTerm) ||
        product.descricao.toLowerCase().includes(searchTerm)
    );

    renderProducts(filteredProducts);
}

// Eventos
document.getElementById('search-input').addEventListener('input', handleSearch);
document.getElementById('search-button').addEventListener('click', handleSearch);

// Carrega os produtos ao abrir a página
loadProducts();
