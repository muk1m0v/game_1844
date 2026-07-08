// Глобальные утилиты для всех страниц

// Показывает красивое уведомление (тост)
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Стили тоста (добавляются динамически, чтобы не зависеть от CSS)
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        padding: '14px 24px',
        borderRadius: '12px',
        background: type === 'success' ? '#b4ff00' : type === 'error' ? '#ff6b6b' : '#2a2a2a',
        color: type === 'success' ? '#0b0b0b' : '#ffffff',
        fontWeight: '600',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        zIndex: '9999',
        transform: 'translateY(20px)',
        opacity: '0',
        transition: 'all 0.4s ease',
        maxWidth: '400px',
        fontSize: '1rem',
        border: '1px solid rgba(255,255,255,0.1)'
    });

    document.body.appendChild(toast);

    // Анимация появления
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    // Автоудаление
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// Показывает модальное окно подтверждения (замена confirm)
export function showConfirm(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(6px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        overlay.innerHTML = `
            <div style="
                background: #1a1a1a;
                border-radius: 16px;
                padding: 30px 40px;
                max-width: 400px;
                width: 90%;
                border: 1px solid #2a2a2a;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                text-align: center;
            ">
                <p style="font-size:1.2rem; margin-bottom:24px;">${message}</p>
                <div style="display:flex; gap:12px; justify-content:center;">
                    <button class="btn btn-secondary" id="confirmNo" style="padding:8px 24px;">Отмена</button>
                    <button class="btn" id="confirmYes" style="padding:8px 24px; background:#b4ff00; color:#0b0b0b;">Да</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#confirmYes').addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });
        overlay.querySelector('#confirmNo').addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

// Проверка авторизации (используется на защищённых страницах)
export function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Обработчик выхода
export function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showToast('Вы вышли из системы', 'info');
            setTimeout(() => window.location.href = '/login.html', 600);
        });
    }
}

// Добавляем стили для анимации (если ещё нет)
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    .cart-item-removing {
        animation: slideOut 0.3s ease forwards;
    }
    @keyframes slideOut {
        to { transform: translateX(100px); opacity: 0; height: 0; padding: 0; margin: 0; overflow: hidden; }
    }
`;
document.head.appendChild(styleSheet);