require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------- Проверка переменных окружения --------------------
const requiredEnv = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = requiredEnv.filter(key => !process.env[key]);
if (missing.length) {
  console.error(`❌ Отсутствуют обязательные переменные окружения: ${missing.join(', ')}`);
  process.exit(1);
}

// -------------------- Безопасность --------------------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// -------------------- Rate Limiting --------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // макс 100 запросов с одного IP
  message: 'Слишком много запросов, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter); // применяем ко всем API-маршрутам

// Более строгий лимит для логина/регистрации
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Слишком много попыток входа/регистрации, подождите.',
  skipSuccessfulRequests: true, // не считать успешные запросы
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

// -------------------- Логирование --------------------
app.use(morgan('combined'));

// -------------------- CORS --------------------
app.use(cors());

// -------------------- Парсеры --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------- Кеширование статики --------------------
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d', // кешировать на 1 день
  etag: true,
  lastModified: true,
}));

// -------------------- Валидация для API (добавляем middleware) --------------------
// Можно добавить глобальную проверку ошибок валидации, но мы будем вызывать вручную в роутах.
// Для примера: добавляем middleware, который проверяет наличие ошибок и возвращает 400.
app.use('/api', (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  }
  next();
});

// -------------------- API маршруты --------------------
app.use('/api', apiRoutes);

// -------------------- Отдача HTML страниц --------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
app.get('/cart.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});
app.get('/product.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// -------------------- Обработка 404 --------------------
app.use((req, res, next) => {
  res.status(404).json({ error: 'Не найдено' });
});

// -------------------- Глобальный обработчик ошибок --------------------
app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// -------------------- Запуск -------------------
app.listen(PORT, () => {
  console.log(`⚡ Flash магазин запущен на http://localhost:${PORT}`);
});