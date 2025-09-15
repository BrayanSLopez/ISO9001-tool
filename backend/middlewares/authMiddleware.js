const jwt = require('jsonwebtoken');
const { getDb } = require('../config/db');
const SECRET = process.env.JWT_SECRET || 'secret_demo';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token requerido' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token formato invalido' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalido' });
    req.user = user; // contiene id_usuario y correo
    next();
  });
}

module.exports = { authenticateToken };
