# index.ejs
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>18:44 — Угадай число</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="/form.css">
    <link rel="stylesheet" href="/game.css">
    <!-- leader.css не нужен на главной, подключаем отдельно при необходимости -->
</head>
<body>
    <!-- ===== ШАПКА ===== -->
    <header class="app-header">
        <div class="header-content">
            <div class="header-left">
                <h1 class="game-title">УГАДАЙ ЧИСЛО</h1>
                <span class="byline">by <%= username %></span>
            </div>
            <div class="header-right">
                <div class="balance-block">
                    <div class="balance-amount"><%= balance %></div>
                    <div class="balance-label">монет</div>
                </div>
                <a href="/leaderboard" class="btn-icon" title="Лидерборд">
                    <i class="fas fa-trophy"></i>
                </a>
                <a href="/logout" class="btn-icon" title="Выйти">
                    <i class="fas fa-sign-out-alt"></i>
                </a>
            </div>
        </div>
    </header>

    <!-- ===== ОСНОВНОЙ КОНТЕНТ ===== -->
    <main class="app-main">
        <div class="game-container">
            <!-- Статистика -->
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value"><%= bestResult || 0 %></div>
                    <div class="stat-label">Лучший результат</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value"><%= winStreak || 0 %></div>
                    <div class="stat-label">Рекорд подряд</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value"><%= totalGames || 0 %></div>
                    <div class="stat-label">Всего игр</div>
                </div>
            </div>

            <!-- Игровая область -->
            <div class="game-area">
                <% if (!finished) { %>
                    <div class="attempts-block">Осталось попыток: <strong><%= attempts %></strong></div>

                    <% if (!canPlay) { %>
                        <div class="message-box" style="background:#fee2e2; border-color:#ef4444; color:#b91c1c;">
                            <i class="fas fa-exclamation-triangle"></i> Недостаточно монет для игры (нужно 2.5). Заработайте их или начните новую игру.
                        </div>
                    <% } else { %>
                        <form class="guess-form" action="/guess" method="POST">
                            <input type="number" name="guess" min="1" max="100" placeholder="Введите число..." required autofocus>
                            <button type="submit" class="btn-primary">Вперёд</button>
                        </form>
                    <% } %>

                    <% if (hint) { %>
                        <div class="hint-box">
                            <i class="fas fa-arrow-<%= hint.includes('больше') ? 'up' : 'down' %>"></i> <%= hint %>
                        </div>
                    <% } %>

                    <% if (message) { %>
                        <div class="message-box"><i class="fas fa-check-circle"></i> <%= message %></div>
                    <% } %>

                <% } else { %>
                    <div class="result-box">
                        <% if (won) { %>
                            <p class="win"><i class="fas fa-trophy"></i> Вы выиграли! +5 монет</p>
                        <% } else { %>
                            <p class="lose"><i class="fas fa-skull"></i> Вы проиграли. −2.5 монеты</p>
                        <% } %>
                        <p class="game-result-detail"><%= hint %></p>
                    </div>
                    <form action="/newgame" method="POST">
                        <button type="submit" class="btn-secondary"><i class="fas fa-redo-alt"></i> Начать новую игру</button>
                    </form>
                <% } %>
            </div>

            <!-- Блок "Как играть" -->
            <div class="how-to-play">
                <h3>Как играть</h3>
                <ul>
                    <li><i class="fas fa-random"></i> Я загадываю число от 1 до 100</li>
                    <li><i class="fas fa-pen"></i> Введите свою версию</li>
                    <li><i class="fas fa-arrows-up-down"></i> Я подскажу: больше или меньше</li>
                    <li><i class="fas fa-trophy"></i> Угадайте за минимальное количество попыток!</li>
                </ul>
            </div>
        </div>
    </main>
</body>
</html>

# layout.ejs
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>18:44 — Угадай число</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="stylesheet" href="/form.css">
    <link rel="stylesheet" href="/game.css">
    <link rel="stylesheet" href="/leader.css"> <!-- ← добавлено -->
</head>
<body>
    <div class="wrapper">
        <%- body %>
    </div>
</body>
</html>

# login.ejs
<div class="card">
    <h1>Вход</h1>
    <p class="subtitle">Добро пожаловать обратно!</p>

    <form class="auth-form" action="/login" method="POST">
        <div class="field">
            <label for="username">Имя пользователя</label>
            <input type="text" name="username" id="username" placeholder="Введите ваше имя пользователя" required>
        </div>
        <div class="field">
            <label for="password">Пароль</label>
            <input type="password" name="password" id="password" placeholder="Введите ваш пароль" required>
        </div>
        <div class="row">
            <label class="checkbox-label">
                <input type="checkbox" name="remember"> Запомнить меня
            </label>
            <a href="#" class="forgot">Забыли пароль?</a>
        </div>
        <button type="submit" class="btn-primary">Войти</button>
    </form>

    <div class="auth-switch">
        Нет аккаунта? <a href="/register">Зарегистрироваться</a>
    </div>

    <% if (error) { %>
        <div class="error"><%= error %></div>
    <% } %>
</div>

# register.ejs
<div class="card">
    <h1>Регистрация</h1>
    <p class="subtitle">Создайте аккаунт для начала</p>

    <form class="auth-form" action="/register" method="POST">
        <div class="field">
            <label for="username">Имя пользователя</label>
            <input type="text" name="username" id="username" placeholder="Введите ваше имя" required>
        </div>
        <div class="field">
            <label for="password">Пароль</label>
            <input type="password" name="password" id="password" placeholder="Создайте пароль" required>
        </div>
        <div class="field">
            <label for="confirmPassword">Подтвердите пароль</label>
            <input type="password" name="confirmPassword" id="confirmPassword" placeholder="Повторите пароль" required>
        </div>
        <button type="submit" class="btn-primary">Зарегистрироваться</button>
    </form>

    <div class="auth-switch">
        Уже есть аккаунт? <a href="/login">Войти</a>
    </div>

    <% if (error) { %>
        <div class="error"><%= error %></div>
    <% } %>
</div>

# leaderboard.ejs
<div class="card">
    <div class="leader-header">
        <h1><i class="fas fa-trophy" style="color: #00E676;"></i> Лидерборд</h1>
        <a href="/" class="btn-back"><i class="fas fa-arrow-left"></i> Назад к игре</a>
    </div>

    <div class="table-wrapper">
        <table class="leader-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Игрок</th>
                    <th>Лучший результат</th>
                    <th>Побед подряд</th>
                    <th>Всего игр</th>
                    <th>Баланс</th>
                </tr>
            </thead>
            <tbody>
                <% if (users.length === 0) { %>
                    <tr><td colspan="6" class="empty">Пока нет сыгранных игр 😔</td></tr>
                <% } else { %>
                    <% users.forEach((user, index) => { %>
                        <tr class="<%= user.id === currentUserId ? 'current-user' : '' %>">
                            <td>
                                <% if (index === 0) { %>🥇
                                <% } else if (index === 1) { %>🥈
                                <% } else if (index === 2) { %>🥉
                                <% } else { %><%= index + 1 %><% } %>
                            </td>
                            <td><strong><%= user.username %></strong></td>
                            <td><%= user.best_result || '—' %></td>
                            <td><%= user.win_streak || 0 %></td>
                            <td><%= user.total_games || 0 %></td>
                            <td><%= parseFloat(user.balance).toFixed(2) %></td>
                        </tr>
                    <% }) %>
                <% } %>
            </tbody>
        </table>
    </div>
</div>