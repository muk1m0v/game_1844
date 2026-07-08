const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const auth = require('../middleware/auth');
require('dotenv').config();

// ----- Аутентификация -----

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { username, password, phone } = req.body;
    // Валидация
    if (!username || !password || !phone) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }
    if (password.length < 3 || password.length > 50) {
      return res.status(400).json({ error: 'Пароль от 3 до 50 символов' });
    }
    if (!phone.startsWith('+992') || phone.length !== 13) {
      return res.status(400).json({ error: 'Телефон должен начинаться с +992 и содержать 13 цифр' });
    }
    // Проверка уникальности username
    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Имя пользователя уже занято' });
    }
    const user = await User.create(username, password, phone);
    res.status(201).json({ message: 'Пользователь создан', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Логин
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Неверное имя или пароль' });
    }
    const match = await User.comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Неверное имя или пароль' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, username: user.username, phone: user.phone } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ----- Товары -----
router.get('/products', async (req, res) => {
  try {
    const products = await Product.getAll();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.getById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Товар не найден' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ----- Корзина (только для авторизованных) -----
router.get('/cart', auth, async (req, res) => {
  try {
    const items = await Cart.getByUser(req.user.id);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/cart', auth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId) return res.status(400).json({ error: 'Не указан товар' });
    const item = await Cart.addItem(req.user.id, productId, quantity || 1);
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.put('/cart/:cartId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) return res.status(400).json({ error: 'Укажите количество' });
    const item = await Cart.updateQuantity(req.params.cartId, quantity);
    if (!item) return res.status(404).json({ error: 'Позиция не найдена' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/cart/:cartId', auth, async (req, res) => {
  try {
    const item = await Cart.removeItem(req.params.cartId);
    if (!item) return res.status(404).json({ error: 'Позиция не найдена' });
    res.json({ message: 'Удалено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/cart', auth, async (req, res) => {
  try {
    await Cart.clear(req.user.id);
    res.json({ message: 'Корзина очищена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;