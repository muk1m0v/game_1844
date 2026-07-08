document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const phone = document.getElementById('phone').value.trim();
    const msgDiv = document.getElementById('registerMessage');

    // Простая валидация на клиенте
    if (password.length < 3 || password.length > 50) {
        msgDiv.textContent = 'Пароль должен быть от 3 до 50 символов';
        msgDiv.className = 'auth-message';
        return;
    }
    if (!phone.startsWith('+992') || phone.length !== 13) {
        msgDiv.textContent = 'Телефон должен быть в формате +992XXXXXXXXX';
        msgDiv.className = 'auth-message';
        return;
    }

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, phone })
        });
        const data = await res.json();
        if (!res.ok) {
            msgDiv.textContent = data.error || 'Ошибка регистрации';
            msgDiv.className = 'auth-message';
            return;
        }
        msgDiv.textContent = '✅ Регистрация успешна! Теперь войдите.';
        msgDiv.className = 'auth-message success';
        document.getElementById('registerForm').reset();
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
    } catch (err) {
        msgDiv.textContent = 'Ошибка соединения с сервером';
        msgDiv.className = 'auth-message';
    }
});