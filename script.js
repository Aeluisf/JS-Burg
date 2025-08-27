document.addEventListener('DOMContentLoaded', () => {
    // SELETORES DE ELEMENTOS
    const productsGrid = document.getElementById('products-grid');
    const searchInput = document.getElementById('searchInput');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const cartBtn = document.querySelector('.cart-btn');
    const cartModal = document.getElementById('cart-modal');
    const addressModal = document.getElementById('address-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const cartItemsContainer = document.getElementById('cart-items');
    const totalPriceEl = document.querySelector('.total-price');
    const cartCountEl = document.getElementById('cart-count');
    const checkoutBtn = document.getElementById('checkout-btn');
    const sendOrderBtn = document.getElementById('send-order-btn');

    let allProducts = [];
    let cart = [];
    // NÚMERO ATUALIZADO AQUI
    const storePhoneNumber = '5598991875270'; 

    async function loadProducts() {
        try {
            const response = await fetch('produtos.json');
            allProducts = await response.json();
            displayProducts(allProducts);
            displayCategoryFilters();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            productsGrid.innerHTML = '<p>Não foi possível carregar o cardápio.</p>';
        }
    }

    function displayProducts(products) {
        productsGrid.innerHTML = '';
        products.forEach(product => {
            let optionsHtml = '';
            let priceHtml = `<span class="price">R$ ${product.price ? product.price.toFixed(2) : 'A partir de'}</span>`;

            if (product.options) {
                const selectId = `options-${product.id}`;
                optionsHtml += `<div class="product-options">
                                    <label for="${selectId}">${product.options.title}</label>
                                    <select id="${selectId}" class="product-option-select">`;
                if (product.options.flavors) {
                    product.options.flavors.forEach(flavor => {
                        optionsHtml += `<option value="${flavor}">${flavor}</option>`;
                    });
                }
                optionsHtml += `</select></div>`;
            }

            const productCard = `
                <div class="product-card" data-id="${product.id}">
                    <img src="${product.img}" alt="${product.name}">
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.description || ''}</p>
                        ${optionsHtml}
                        <div class="product-footer">
                            ${priceHtml}
                            <button class="add-to-cart-btn">Adicionar</button>
                        </div>
                    </div>
                </div>`;
            productsGrid.innerHTML += productCard;
        });
    }

    function displayCategoryFilters() {
        const categories = ['Todos', ...new Set(allProducts.map(p => p.category))];
        categoryFiltersContainer.innerHTML = categories.map(category =>
            `<button class="category-btn ${category === 'Todos' ? 'active' : ''}" data-category="${category}">${category}</button>`
        ).join('');
    }

    function addToCart(productId, selectedOptionName = null) {
        const product = allProducts.find(p => p.id === productId);
        const cartItemId = selectedOptionName ? `${productId}-${selectedOptionName.replace(/\s+/g, '-')}` : productId.toString();
        
        const existingItem = cart.find(item => item.cartItemId === cartItemId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            const newItem = {
                id: product.id,
                name: selectedOptionName ? `${product.name} (${selectedOptionName})` : product.name,
                price: product.price,
                img: product.img,
                quantity: 1,
                cartItemId: cartItemId
            };
            cart.push(newItem);
        }
        updateCart();
    }

    function changeQuantity(cartItemId, change) {
        const cartItem = cart.find(item => item.cartItemId === cartItemId);
        if (cartItem) {
            cartItem.quantity += change;
            if (cartItem.quantity <= 0) {
                removeFromCart(cartItemId);
            } else {
                updateCart();
            }
        }
    }

    function removeFromCart(cartItemId) {
        cart = cart.filter(item => item.cartItemId !== cartItemId);
        updateCart();
    }

    function updateCart() {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let totalItems = 0;

        cart.forEach(item => {
            total += item.price * item.quantity;
            totalItems += item.quantity;

            const cartItemEl = `
                <div class="cart-item" data-id="${item.cartItemId}">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <p>${item.name}</p>
                        <p>R$ ${item.price.toFixed(2)}</p>
                        <div class="quantity-controls">
                            <button class="decrease-qty">-</button>
                            <span>${item.quantity}</span>
                            <button class="increase-qty">+</button>
                        </div>
                    </div>
                    <button class="remove-item-btn"><i class="fa-solid fa-trash"></i></button>
                </div>`;
            cartItemsContainer.innerHTML += cartItemEl;
        });

        totalPriceEl.textContent = `Total: R$ ${total.toFixed(2)}`;
        cartCountEl.textContent = totalItems;
        checkoutBtn.disabled = cart.length === 0;
    }
    
    productsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const card = e.target.closest('.product-card');
            const productId = parseInt(card.dataset.id);
            
            const selectEl = card.querySelector('.product-option-select');
            const selectedOption = selectEl ? selectEl.value : null;

            addToCart(productId, selectedOption);
        }
    });

    cartItemsContainer.addEventListener('click', (e) => {
        const target = e.target;
        const cartItemEl = target.closest('.cart-item');
        if (!cartItemEl) return;

        const cartItemId = cartItemEl.dataset.id;

        if (target.closest('.increase-qty')) {
            changeQuantity(cartItemId, 1);
        }
        if (target.closest('.decrease-qty')) {
            changeQuantity(cartItemId, -1);
        }
        if (target.closest('.remove-item-btn')) {
            removeFromCart(cartItemId);
        }
    });

    function sendOrderToWhatsApp() {
        const address = document.getElementById('address-input').value;
        if (!address) { alert('Por favor, informe seu endereço.'); return; }
        const reference = document.getElementById('address-ref').value;
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const observations = document.getElementById('observations').value;
        let message = "*🍔 NOVO PEDIDO - JS BURGUER 🍔*\n\n*Itens do Pedido:*\n";
        cart.forEach(item => { message += `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`; });
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        message += `\n*Total:* R$ ${total.toFixed(2)}\n\n*Endereço de Entrega:*\n${address}\n`;
        if (reference) message += `*Referência:* ${reference}\n`;
        message += `\n*Forma de Pagamento:* ${paymentMethod}\n`;
        if (observations) message += `*Observações:* ${observations}\n`;
        window.open(`https://wa.me/${storePhoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
    
    searchInput.addEventListener('input', () => { const searchTerm = searchInput.value.toLowerCase(); displayProducts(allProducts.filter(p => p.name.toLowerCase().includes(searchTerm) || (p.description && p.description.toLowerCase().includes(searchTerm)))); });
    categoryFiltersContainer.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') { document.querySelector('.category-btn.active').classList.remove('active'); e.target.classList.add('active'); const category = e.target.dataset.category; displayProducts(category === 'Todos' ? allProducts : allProducts.filter(p => p.category === category)); } });
    cartBtn.addEventListener('click', () => (cartModal.style.display = 'flex'));
    closeBtns.forEach(btn => btn.addEventListener('click', () => { cartModal.style.display = 'none'; addressModal.style.display = 'none'; }));
    checkoutBtn.addEventListener('click', () => { cartModal.style.display = 'none'; addressModal.style.display = 'flex'; });
    sendOrderBtn.addEventListener('click', sendOrderToWhatsApp);
    
    loadProducts();
});