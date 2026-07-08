const pool = require('./db');

const Product = {
  // Получить все товары
  async getAll() {
    const query = 'SELECT * FROM products ORDER BY id';
    const res = await pool.query(query);
    return res.rows;
  },

  // Получить один товар по id
  async getById(id) {
    const query = 'SELECT * FROM products WHERE id = $1';
    const res = await pool.query(query, [id]);
    return res.rows[0];
  }
};

module.exports = Product;