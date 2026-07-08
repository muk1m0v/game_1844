const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const auth = require('../middleware/auth');
require('dotenv').config();

// -------------------- Вспомогательная функция для проверки валидации --------------------
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    return res.status(400).json({ error: errors.array().map(e => e.msg).join(', ') });
  };
};

// ----- Аутентификация -----

// Регистрация
router.post('/register',
  validate([
    body('username')
      .isLength({ min: 3, max: 30 }).withMessage('Имя должно быть от 3 до 30 символов')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Имя может содержать только буквы, цифры и _'),
    body('password')
      .isLength({ min: 3, max: 50 }).withMessage('Пароль от 3 до 50 символов'),
    body('phone')
      .matches(/^\+992\d{9}$/).withMessage('Телефон должен начинаться с +992 и содержать 13 цифр')
  ]),
  async (req, res) => {
    try {
      const { username, password, phone } = req.body;

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
  }
);

// Логин
router.post('/login',
  validate([
    body('username').notEmpty().withMessage('Имя обязательно'),
    body('password').notEmpty().withMessage('Пароль обязателен')
  ]),
  async (req, res) => {
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
  }
);

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

router.get('/products/:id',
  validate([
    param('id').isInt().withMessage('ID товара должно быть числом')
  ]),
  async (req, res) => {
    try {
      const product = await Product.getById(req.params.id);
      if (!product) return res.status(404).json({ error: 'Товар не найден' });
      res.json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// ----- Корзина (только для авторизованных) -----

// Получить корзину
router.get('/cart', auth, async (req, res) => {
  try {
    const items = await Cart.getByUser(req.user.id);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить товар в корзину
router.post('/cart',
  auth,
  validate([
    body('productId').isInt().withMessage('ID товара должно быть числом'),
    body('quantity')
      .optional()
      .isInt({ min: 1 }).withMessage('Количество должно быть ≥ 1')
  ]),
  async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;

      // Проверяем, существует ли товар
      const product = await Product.getById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
      }

      const item = await Cart.addItem(req.user.id, productId, quantity);
      res.status(201).json(item);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Обновить количество в корзине
router.put('/cart/:cartId',
  auth,
  validate([
    param('cartId').isInt().withMessage('ID корзины должно быть числом'),
    body('quantity').isInt({ min: 1 }).withMessage('Количество должно быть ≥ 1')
  ]),
  async (req, res) => {
    try {
      const cartId = req.params.cartId;

      // Проверяем, принадлежит ли позиция пользователю
      const cartItem = await Cart.getById(cartId);
      if (!cartItem) {
        return res.status(404).json({ error: 'Позиция не найдена' });
      }
      if (cartItem.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Нет доступа к этой позиции' });
      }

      const { quantity } = req.body;
      const updated = await Cart.updateQuantity(cartId, quantity);
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Удалить позицию из корзины
router.delete('/cart/:cartId',
  auth,
  validate([
    param('cartId').isInt().withMessage('ID корзины должно быть числом')
  ]),
  async (req, res) => {
    try {
      const cartId = req.params.cartId;

      // Проверяем владельца
      const cartItem = await Cart.getById(cartId);
      if (!cartItem) {
        return res.status(404).json({ error: 'Позиция не найдена' });
      }
      if (cartItem.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Нет доступа к этой позиции' });
      }

      await Cart.removeItem(cartId);
      res.json({ message: 'Удалено' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

// Очистить корзину пользователя
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