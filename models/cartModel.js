const pool = require('./db');

const Cart = {
  // Получить корзину пользователя
  async getByUser(userId) {
    const query = `
      SELECT c.id, c.quantity, p.*
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `;
    const res = await pool.query(query, [userId]);
    return res.rows;
  },

  // Добавить товар (или увеличить количество)
  async addItem(userId, productId, quantity = 1) {
    // Проверяем, есть ли уже такой товар в корзине
    const existQuery = 'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2';
    const exist = await pool.query(existQuery, [userId, productId]);
    if (exist.rows.length > 0) {
      // Обновляем количество
      const newQty = exist.rows[0].quantity + quantity;
      const updateQuery = 'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *';
      const res = await pool.query(updateQuery, [newQty, exist.rows[0].id]);
      return res.rows[0];
    } else {
      const insertQuery = `
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const res = await pool.query(insertQuery, [userId, productId, quantity]);
      return res.rows[0];
    }
  },

  // Обновить количество
  async updateQuantity(cartId, quantity) {
    const query = 'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *';
    const res = await pool.query(query, [quantity, cartId]);
    return res.rows[0];
  },

  // Удалить позицию
  async removeItem(cartId) {
    const query = 'DELETE FROM cart WHERE id = $1 RETURNING *';
    const res = await pool.query(query, [cartId]);
    return res.rows[0];
  },

  // Очистить корзину пользователя
  async clear(userId) {
    const query = 'DELETE FROM cart WHERE user_id = $1';
    await pool.query(query, [userId]);
  }
};

module.exports = Cart;