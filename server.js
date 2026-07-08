const express = require('express');
require('dotenv').config();
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = 3000;

// Подключение к PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_DATABASE,
});

// Проверка и создание необходимых полей в таблице users
(async () => {
    try {
        const client = await pool.connect();
        const checkColumns = async (column) => {
            const res = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name=$1
            `, [column]);
            return res.rows.length > 0;
        };

        if (!(await checkColumns('best_result'))) {
            await client.query('ALTER TABLE users ADD COLUMN best_result INTEGER DEFAULT 0');
        }
        if (!(await checkColumns('win_streak'))) {
            await client.query('ALTER TABLE users ADD COLUMN win_streak INTEGER DEFAULT 0');
        }
        if (!(await checkColumns('total_games'))) {
            await client.query('ALTER TABLE users ADD COLUMN total_games INTEGER DEFAULT 0');
        }
        client.release();
        console.log('✅ Поля статистики проверены/созданы');
    } catch (err) {
        console.error('Ошибка инициализации БД:', err);
    }
})();

// Настройка сессий
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware авторизации
const requireAuth = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    next();
};

// === ГЛАВНАЯ СТРАНИЦА (игра + статистика) ===
app.get('/', requireAuth, async (req, res) => {
    try {
        const userQuery = await pool.query(
            `SELECT username, balance, best_result, win_streak, total_games 
             FROM users WHERE id = $1`,
            [req.session.userId]
        );
        const user = userQuery.rows[0];

        if (!req.session.game) {
            req.session.game = {
                secret: Math.floor(Math.random() * 100) + 1,
                attempts: 10,
                finished: false,
                won: false,
                usedAttempts: 0
            };
        }

        const game = req.session.game;
        let message = req.session.message || '';
        req.session.message = '';

        // Проверка баланса для отображения предупреждения
        const balance = parseFloat(user.balance);
        const canPlay = balance >= 2.5 || game.finished; // можно играть, если игра закончена (кнопка новой игры)

        res.render('index', {
            username: user.username,
            balance: balance.toFixed(2),
            bestResult: user.best_result || 0,
            winStreak: user.win_streak || 0,
            totalGames: user.total_games || 0,
            attempts: game.attempts,
            finished: game.finished,
            won: game.won,
            message: message,
            hint: req.session.hint || '',
            canPlay: canPlay,
            layout: false   // <--- отключаем общий layout, чтобы шапка была на всю ширину
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

// === Обработка хода ===
app.post('/guess', requireAuth, async (req, res) => {
    const { guess } = req.body;
    const game = req.session.game;

    if (!game || game.finished) return res.redirect('/');

    // Проверка баланса перед ходом
    const userRes = await pool.query('SELECT balance FROM users WHERE id = $1', [req.session.userId]);
    const balance = parseFloat(userRes.rows[0].balance);
    if (balance < 2.5) {
        req.session.message = '⚠️ Недостаточно монет для игры (нужно 2.5).';
        return res.redirect('/');
    }

    const number = parseInt(guess);
    if (isNaN(number) || number < 1 || number > 100) {
        req.session.message = 'Введите число от 1 до 100!';
        return res.redirect('/');
    }

    game.attempts--;
    game.usedAttempts++;

    let hint = '';
    let gameWon = false;

    if (number === game.secret) {
        gameWon = true;
        game.finished = true;
        game.won = true;
        hint = `🎉 Поздравляем! Вы угадали число ${game.secret}!`;
        await updateStats(req.session.userId, true, game.usedAttempts);
        await pool.query('UPDATE users SET balance = balance + 5 WHERE id = $1', [req.session.userId]);
    } else if (game.attempts === 0) {
        game.finished = true;
        game.won = false;
        hint = `😞 Попытки закончились. Загаданное число было ${game.secret}.`;
        await updateStats(req.session.userId, false, null);
        await pool.query('UPDATE users SET balance = balance - 2.5 WHERE id = $1', [req.session.userId]);
    } else {
        if (number < game.secret) {
            hint = `📈 Загаданное число больше ${number}`;
        } else {
            hint = `📉 Загаданное число меньше ${number}`;
        }
    }

    req.session.hint = hint;
    req.session.game = game;
    res.redirect('/');
});

// === Обновление статистики ===
async function updateStats(userId, won, usedAttempts) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE users SET total_games = total_games + 1 WHERE id = $1', [userId]);

        if (won) {
            await client.query('UPDATE users SET win_streak = win_streak + 1 WHERE id = $1', [userId]);
            const currentBest = await client.query(
                'SELECT best_result FROM users WHERE id = $1',
                [userId]
            );
            const best = currentBest.rows[0].best_result || Infinity;
            if (usedAttempts < best) {
                await client.query(
                    'UPDATE users SET best_result = $1 WHERE id = $2',
                    [usedAttempts, userId]
                );
            }
        } else {
            await client.query('UPDATE users SET win_streak = 0 WHERE id = $1', [userId]);
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
    } finally {
        client.release();
    }
}

// === Новая игра ===
app.post('/newgame', requireAuth, async (req, res) => {
    // Проверка баланса для старта новой игры (если закончилась, то можно)
    const userRes = await pool.query('SELECT balance FROM users WHERE id = $1', [req.session.userId]);
    const balance = parseFloat(userRes.rows[0].balance);
    if (balance < 2.5) {
        req.session.message = '⚠️ Недостаточно монет для новой игры (нужно 2.5).';
        return res.redirect('/');
    }

    req.session.game = {
        secret: Math.floor(Math.random() * 100) + 1,
        attempts: 10,
        finished: false,
        won: false,
        usedAttempts: 0
    };
    req.session.hint = '';
    req.session.message = 'Новая игра начата! Удачи!';
    res.redirect('/');
});

// Создание таблицы товаров (если не существует)
(async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS shop_items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                effect_type VARCHAR(50) NOT NULL, -- 'extra_attempt' или 'hint_range'
                effect_value INTEGER
            );
        `);
        // Добавляем товары, если их нет
        const items = [
            ['Дополнительная попытка', 'Даёт +1 попытку в текущей игре', 5.00, 'extra_attempt', 1],
            ['Умная подсказка', 'Сужает диапазон до 10 чисел вокруг загаданного', 3.00, 'hint_range', 10]
        ];
        for (const [name, desc, price, effect, value] of items) {
            await client.query(`
                INSERT INTO shop_items (name, description, price, effect_type, effect_value)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO NOTHING
            `, [name, desc, price, effect, value]);
        }
    } catch (err) {
        console.error('Ошибка инициализации магазина:', err);
    } finally {
        client.release();
    }
})();

// === МАГАЗИН ===
app.get('/shop', requireAuth, async (req, res) => {
    try {
        const items = await pool.query('SELECT * FROM shop_items ORDER BY id');
        const user = await pool.query('SELECT balance FROM users WHERE id = $1', [req.session.userId]);
        res.render('shop', {
            items: items.rows,
            balance: parseFloat(user.rows[0].balance).toFixed(2)
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

app.post('/buy/:itemId', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const itemId = parseInt(req.params.itemId);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Получаем товар
        const itemRes = await client.query('SELECT * FROM shop_items WHERE id = $1', [itemId]);
        if (itemRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('Товар не найден');
        }
        const item = itemRes.rows[0];
        // Проверяем баланс
        const userRes = await client.query('SELECT balance FROM users WHERE id = $1', [userId]);
        const balance = parseFloat(userRes.rows[0].balance);
        if (balance < parseFloat(item.price)) {
            await client.query('ROLLBACK');
            req.session.message = '⚠️ Недостаточно монет для покупки.';
            return res.redirect('/shop');
        }
        // Списываем монеты
        await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [item.price, userId]);

        // Применяем эффект
        const game = req.session.game;
        if (item.effect_type === 'extra_attempt' && game && !game.finished) {
            game.attempts += item.effect_value;
            req.session.message = `✅ Куплена дополнительная попытка! Теперь у вас ${game.attempts} попыток.`;
        } else if (item.effect_type === 'hint_range' && game && !game.finished) {
            // Сужаем диапазон: показываем, что число между secret - 10 и secret + 10 (с ограничениями)
            const secret = game.secret;
            let low = Math.max(1, secret - item.effect_value);
            let high = Math.min(100, secret + item.effect_value);
            req.session.hint = `🔍 Подсказка: число находится в диапазоне ${low}–${high}`;
            req.session.message = '✅ Подсказка активирована!';
        } else {
            req.session.message = '⚠️ Эффект не может быть применён (игра не активна или завершена). Монеты возвращены.';
            // Возвращаем монеты
            await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [item.price, userId]);
            await client.query('ROLLBACK');
            return res.redirect('/shop');
        }

        // Сохраняем игру в сессию
        req.session.game = game;
        await client.query('COMMIT');
        res.redirect('/shop');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Ошибка при покупке');
    } finally {
        client.release();
    }
});

// === Регистрация ===
app.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.render('register', { error: '' });
});

app.post('/register', async (req, res) => {
    const { username, password, confirmPassword } = req.body;
    if (!username || !password || !confirmPassword) {
        return res.render('register', { error: 'Заполните все поля' });
    }
    if (password !== confirmPassword) {
        return res.render('register', { error: 'Пароли не совпадают' });
    }

    try {
        const check = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (check.rows.length > 0) {
            return res.render('register', { error: 'Этот username уже занят, попробуйте другой' });
        }

        const hash = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, password_hash, balance) VALUES ($1, $2, 0)',
            [username, hash]
        );
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('register', { error: 'Ошибка сервера' });
    }
});

// === Вход ===
app.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/');
    res.render('login', { error: '' });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('login', { error: 'Заполните все поля' });
    }

    try {
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
            return res.render('login', { error: 'Неверный username или пароль' });
        }

        const match = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!match) {
            return res.render('login', { error: 'Неверный username или пароль' });
        }

        req.session.userId = user.rows[0].id;
        req.session.game = {
            secret: Math.floor(Math.random() * 100) + 1,
            attempts: 10,
            finished: false,
            won: false,
            usedAttempts: 0
        };
        req.session.hint = '';
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Ошибка сервера' });
    }
});

// === Выход ===
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// === ЛИДЕРБОРД ===
app.get('/leaderboard', requireAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT username, best_result, win_streak, total_games, balance
            FROM users
            WHERE total_games > 0
            ORDER BY best_result ASC NULLS LAST, win_streak DESC
            LIMIT 100
        `);
        res.render('leaderboard', { 
            users: result.rows,
            currentUserId: req.session.userId
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log('✅ Версия игры 1.08 дата создание: 07-07-2026 23:57:58');
    console.info('\n💡 Полнедные обновление 08-07-2026 12:30:03');
});