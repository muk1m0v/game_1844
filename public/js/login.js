document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const msgDiv = document.getElementById('loginMessage');

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) {
            msgDiv.textContent = data.error || 'Ошибка входа';
            msgDiv.className = 'auth-message';
            return;
        }
        // Сохраняем токен и данные пользователя
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        msgDiv.textContent = '✅ Успешный вход! Перенаправление...';
        msgDiv.className = 'auth-message success';
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    } catch (err) {
        msgDiv.textContent = 'Ошибка соединения с сервером';
        msgDiv.className = 'auth-message';
    }
});