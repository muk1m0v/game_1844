const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token
  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, phone }
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Неверный токен' });
  }
};

module.exports = auth;