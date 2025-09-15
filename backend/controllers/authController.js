const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/db');

const SECRET = process.env.JWT_SECRET || 'secret_demo';

// Registro
router.post('/register', (req, res) => {
  const db = getDb();
  const {
    nombre,
    correo,
    password,
    // empresa info
    razon_social,
    nit,
    representante_legal,
    sector_economico,
    tipo_empresa,
    direccion,
    telefono,
    num_empleados,
    email_empresa,
    web,
    facebook,
    instagram,
    tiktok
  } = req.body;

  // Crear empresa primero
  db.run(
    `INSERT INTO empresas (
      razon_social, nit, representante_legal, sector_economico, tipo_empresa,
      direccion, telefono, num_empleados, email, web, facebook, instagram, tiktok
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      razon_social,
      nit,
      representante_legal,
      sector_economico,
      tipo_empresa,
      direccion,
      telefono,
      num_empleados,
      email_empresa,
      web,
      facebook,
      instagram,
      tiktok
    ],
    function (err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Error creando empresa', detail: err.message });
      }

      const empresaId = this.lastID;

      bcrypt.hash(password, 10, (errh, hash) => {
        if (errh) {
          db.close();
          return res.status(500).json({ error: 'Error encriptando password' });
        }

        db.run(
          `INSERT INTO usuarios (nombre, correo, password, empresa_id) VALUES (?,?,?,?)`,
          [nombre, correo, hash, empresaId],
          function (err2) {
            if (err2) {
              db.close();
              return res.status(500).json({ error: 'Error creando usuario', detail: err2.message });
            }

            const userId = this.lastID;
            const token = jwt.sign({ id_usuario: userId, correo }, SECRET, { expiresIn: '12h' });

            db.close();
            res.json({ message: 'Usuario creado', token });
          }
        );
      });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { correo, password } = req.body;
  const db = getDb();

  db.get('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, user) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Error DB' });
    }
    if (!user) {
      db.close();
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    bcrypt.compare(password, user.password, (errc, ok) => {
      db.close();
      if (errc) return res.status(500).json({ error: 'Error verificando password' });
      if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' });

      const token = jwt.sign(
        { id_usuario: user.id_usuario, correo: user.correo },
        SECRET,
        { expiresIn: '12h' }
      );

      res.json({
        message: 'Login OK',
        token,
        user: { id_usuario: user.id_usuario, nombre: user.nombre, correo: user.correo }
      });
    });
  });
});

module.exports = router;

