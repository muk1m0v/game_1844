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

// Получаем ID из URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

if (!productId) {
    document.getElementById('productDetail').innerHTML = '<p style="color:#ff6b6b;">Товар не указан</p>';
} else {
    loadProduct(productId);
}

async function loadProduct(id) {
    try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
            if (res.status === 404) {
                document.getElementById('productDetail').innerHTML = '<p style="color:#ff6b6b;">Товар не найден</p>';
                return;
            }
            throw new Error('Ошибка загрузки');
        }
        const product = await res.json();
        renderProduct(product);
    } catch (err) {
        console.error(err);
        document.getElementById('productDetail').innerHTML = '<p style="color:#ff6b6b;">Не удалось загрузить товар</p>';
    }
}

function renderProduct(product) {
    const container = document.getElementById('productDetail');
    container.innerHTML = `
        <img src="${product.image_url || '/images/placeholder.jpg'}" alt="${product.name}" />
        <div class="product-info">
            <h1>${product.name}</h1>
            <div class="price">$${product.price}</div>
            <div class="desc">${product.description || 'Описание отсутствует'}</div>
            <button class="btn btn-primary add-to-cart" data-id="${product.id}">Добавить в корзину</button>
        </div>
    `;

    // Обработчик добавления в корзину
    const addBtn = container.querySelector('.add-to-cart');
    addBtn.addEventListener('click', async () => {
        await addToCart(product.id);
    });
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