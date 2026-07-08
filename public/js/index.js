import { checkAuth, setupLogout, showToast } from './global.js';

if (!checkAuth()) {
    // редирект уже внутри
}
setupLogout();

// Загрузка товаров
async function loadProducts() {
    const container = document.getElementById('productList');
    container.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Загрузка...</div>';

    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Ошибка загрузки');
        const products = await res.json();
        if (products.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);text-align:center;">Товары скоро появятся</p>';
            return;
        }
        container.innerHTML = products.map(p => `
            <div class="product-card" data-id="${p.id}">
                <a href="/product.html?id=${p.id}" class="product-link">
                    <img src="${p.image_url || '/images/placeholder.jpg'}" alt="${p.name}" />
                    <h3>${p.name}</h3>
                    <div class="price">$${p.price}</div>
                    <div class="desc">${p.description || ''}</div>
                </a>
                <button class="btn btn-primary add-to-cart" data-id="${p.id}">В корзину</button>
            </div>
        `).join('');

        // Обработчики добавления
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const productId = btn.dataset.id;
                await addToCart(productId);
            });
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="color:#ff6b6b;text-align:center;">Не удалось загрузить товары</p>';
    }
}

async function addToCart(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Войдите в систему', 'error');
        return;
    }
    try {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });
        if (!res.ok) {
            const err = await res.json();
            showToast(err.error || 'Ошибка добавления', 'error');
            return;
        }
        showToast('✅ Товар добавлен в корзину!', 'success');
    } catch (err) {
        showToast('Ошибка соединения', 'error');
    }
}

loadProducts();