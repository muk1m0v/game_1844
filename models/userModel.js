const pool = require('./db');
const bcrypt = require('bcryptjs');  // вместо bcrypt

const User = {
  // Создание пользователя
  async create(username, password, phone) {
    const hashed = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (username, password, phone)
      VALUES ($1, $2, $3)
      RETURNING id, username, phone
    `;
    const res = await pool.query(query, [username, hashed, phone]);
    return res.rows[0];
  },

  // Поиск по имени
  async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const res = await pool.query(query, [username]);
    return res.rows[0];
  },

  // Проверка пароля
  async comparePassword(plain, hashed) {
    return await bcrypt.compare(plain, hashed);
  }
};

module.exports = User;