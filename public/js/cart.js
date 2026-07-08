import { checkAuth, setupLogout, showToast, showConfirm } from './global.js';

if (!checkAuth()) return;
setupLogout();

const cartItemsDiv = document.getElementById('cartItems');
const emptyCartDiv = document.getElementById('emptyCart');
const totalSpan = document.getElementById('totalPrice');
const cartContainer = document.getElementById('cartContainer');
const summaryDiv = cartContainer.querySelector('.cart-summary');

let currentItems = [];

async function loadCart() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ошибка загрузки корзины');
        currentItems = await res.json();

        if (currentItems.length === 0) {
            cartItemsDiv.style.display = 'none';
            emptyCartDiv.style.display = 'block';
            summaryDiv.style.display = 'none';
            return;
        }

        cartItemsDiv.style.display = 'flex';
        emptyCartDiv.style.display = 'none';
        summaryDiv.style.display = 'flex';

        let total = 0;
        cartItemsDiv.innerHTML = currentItems.map(item => {
            const price = parseFloat(item.price);
            const subtotal = price * item.quantity;
            total += subtotal;
            return `
                <div class="cart-item" data-cartid="${item.id}">
                    <div class="cart-item-info">
                        <img src="${item.image_url || '/images/placeholder.jpg'}" alt="${item.name}" />
                        <div>
                            <div class="name">${item.name}</div>
                            <div class="price">$${price.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <input type="number" min="1" value="${item.quantity}" class="qty-input" />
                        <button class="btn btn-sm btn-secondary update-qty">Обновить</button>
                        <button class="btn btn-sm btn-secondary remove-item">Удалить</button>
                    </div>
                </div>
            `;
        }).join('');

        totalSpan.textContent = total.toFixed(2);

        // Обработчики обновления
        document.querySelectorAll('.update-qty').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const cartItem = e.target.closest('.cart-item');
                const cartId = cartItem.dataset.cartid;
                const input = cartItem.querySelector('.qty-input');
                const qty = parseInt(input.value);
                if (qty < 1) {
                    showToast('Количество должно быть ≥ 1', 'error');
                    return;
                }
                try {
                    const res = await fetch(`/api/cart/${cartId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ quantity: qty })
                    });
                    if (!res.ok) throw new Error('Ошибка обновления');
                    showToast('Количество обновлено', 'success');
                    loadCart();
                } catch (err) {
                    showToast('Не удалось обновить', 'error');
                }
            });
        });

        // Обработчики удаления
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const cartItem = e.target.closest('.cart-item');
                const cartId = cartItem.dataset.cartid;
                const confirmed = await showConfirm('Удалить этот товар из корзины?');
                if (!confirmed) return;

                // Анимация удаления
                cartItem.classList.add('cart-item-removing');
                try {
                    const res = await fetch(`/api/cart/${cartId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) throw new Error('Ошибка удаления');
                    showToast('Товар удалён', 'success');
                    setTimeout(() => loadCart(), 300);
                } catch (err) {
                    showToast('Не удалось удалить', 'error');
                    cartItem.classList.remove('cart-item-removing');
                }
            });
        });

    } catch (err) {
        console.error(err);
        cartItemsDiv.innerHTML = '<p style="color:#ff6b6b;">Ошибка загрузки корзины</p>';
    }
}

// Очистка корзины
document.getElementById('clearCartBtn').addEventListener('click', async () => {
    const confirmed = await showConfirm('Очистить всю корзину?');
    if (!confirmed) return;
    try {
        const res = await fetch('/api/cart', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Ошибка очистки');
        showToast('Корзина очищена', 'success');
        loadCart();
    } catch (err) {
        showToast('Не удалось очистить корзину', 'error');
    }
});

loadCart();