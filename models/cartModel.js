const pool = require('./db');

const Cart = {
  // Получить все товары корзины пользователя
  async getByUser(userId) {
    const query = `
      SELECT c.id, c.user_id, c.product_id, c.quantity, 
             p.name, p.price, p.image_url
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
    `;
    const res = await pool.query(query, [userId]);
    return res.rows;
  },

  // Добавить товар в корзину
  async addItem(userId, productId, quantity) {
    // Проверяем, есть ли уже такой товар в корзине пользователя
    const check = await pool.query(
      'SELECT id, quantity FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    if (check.rows.length > 0) {
      // Обновляем количество
      const newQty = check.rows[0].quantity + quantity;
      const update = await pool.query(
        'UPDATE cart SET quantity = $1 WHERE id = $2 RETURNING *',
        [newQty, check.rows[0].id]
      );
      return update.rows[0];
    } else {
      // Вставляем новую запись
      const insert = await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [userId, productId, quantity]
      );
      return insert.rows[0];
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
  },

  // Получить позицию по ID (для проверки владельца)
  async getById(cartId) {
    const query = 'SELECT * FROM cart WHERE id = $1';
    const res = await pool.query(query, [cartId]);
    return res.rows[0];
  }
};

module.exports = Cart;