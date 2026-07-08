import { checkAuth, setupLogout, showToast } from './global.js';

if (!checkAuth()) return;
setupLogout();

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

if (!productId) {
    document.getElementById('productDetail').innerHTML = '<p style="color:#ff6b6b;">Товар не указан</p>';
} else {
    loadProduct(productId);
}

async function loadProduct(id) {
    const container = document.getElementById('productDetail');
    container.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Загрузка...</div>';

    try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
            if (res.status === 404) {
                container.innerHTML = '<p style="color:#ff6b6b;">Товар не найден</p>';
                return;
            }
            throw new Error('Ошибка загрузки');
        }
        const product = await res.json();
        renderProduct(product);
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p style="color:#ff6b6b;">Не удалось загрузить товар</p>';
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

    container.querySelector('.add-to-cart').addEventListener('click', async () => {
        await addToCart(product.id);
    });
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