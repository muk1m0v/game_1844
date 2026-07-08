require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API маршруты
app.use('/api', apiRoutes);

// Отдача HTML страниц (SPA-подход, но отдельные HTML)
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

app.listen(PORT, () => {
  console.log(`⚡ Flash магазин запущен на http://localhost:${PORT}`);
});