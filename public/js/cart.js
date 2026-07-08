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

const cartItemsDiv = document.getElementById('cartItems');
const emptyCartDiv = document.getElementById('emptyCart');
const totalSpan = document.getElementById('totalPrice');

async function loadCart() {
    try {
        const res = await fetch('/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ошибка загрузки корзины');
        const items = await res.json();
        if (items.length === 0) {
            cartItemsDiv.style.display = 'none';
            emptyCartDiv.style.display = 'block';
            document.getElementById('cartContainer').querySelector('.cart-summary').style.display = 'none';
            return;
        }
        cartItemsDiv.style.display = 'flex';
        emptyCartDiv.style.display = 'none';
        document.getElementById('cartContainer').querySelector('.cart-summary').style.display = 'flex';

        let total = 0;
        cartItemsDiv.innerHTML = items.map(item => {
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

        // Обработчики
        document.querySelectorAll('.update-qty').forEach(btn => {
            btn.addEventListener('click', async () => {
                const cartItem = btn.closest('.cart-item');
                const cartId = cartItem.dataset.cartid;
                const input = cartItem.querySelector('.qty-input');
                const qty = parseInt(input.value);
                if (qty < 1) return alert('Количество должно быть >= 1');
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
                    loadCart(); // перезагружаем
                } catch (err) {
                    alert('Не удалось обновить');
                }
            });
        });

        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', async () => {
                const cartItem = btn.closest('.cart-item');
                const cartId = cartItem.dataset.cartid;
                if (!confirm('Удалить товар из корзины?')) return;
                try {
                    const res = await fetch(`/api/cart/${cartId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) throw new Error('Ошибка удаления');
                    loadCart();
                } catch (err) {
                    alert('Не удалось удалить');
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
    if (!confirm('Очистить корзину?')) return;
    try {
        const res = await fetch('/api/cart', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ошибка очистки');
        loadCart();
    } catch (err) {
        alert('Не удалось очистить корзину');
    }
});

loadCart();