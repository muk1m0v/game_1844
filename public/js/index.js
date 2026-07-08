// Проверка авторизации
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login.html';
}

const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
});

// Загрузка товаров
async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Ошибка загрузки');
        const products = await res.json();
        const container = document.getElementById('productList');
        if (products.length === 0) {
            container.innerHTML = '<p style="color:#aaa;">Товары скоро появятся</p>';
            return;
        }
        container.innerHTML = products.map(p => `
            <div class="product-card">
                <a href="/product.html?id=${p.id}" class="product-link">
                    <img src="${p.image_url || '/images/placeholder.jpg'}" alt="${p.name}" />
                    <h3>${p.name}</h3>
                    <div class="price">$${p.price}</div>
                    <div class="desc">${p.description || ''}</div>
                </a>
                <button class="btn btn-primary add-to-cart" data-id="${p.id}" data-name="${p.name}">В корзину</button>
            </div>
        `).join('');

        // Обработчики добавления в корзину (без перехода)
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation(); // чтобы не сработал переход по ссылке
                const productId = btn.dataset.id;
                await addToCart(productId);
            });
        });
    } catch (err) {
        console.error(err);
        document.getElementById('productList').innerHTML = '<p style="color:#ff6b6b;">Не удалось загрузить товары</p>';
    }
}

async function addToCart(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Войдите в систему');
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
            alert(err.error || 'Ошибка добавления');
            return;
        }
        alert('Товар добавлен в корзину!');
    } catch (err) {
        alert('Ошибка соединения');
    }
}

loadProducts();