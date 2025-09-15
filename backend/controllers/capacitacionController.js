const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getDb } = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Listar documentos base (carpeta /docs) - los servimos en /docs/... estático
router.get('/docs', (req, res) => {
  // Lista fija de categorías y archivos (puedes poblar /docs con archivos reales)
  const list = [
    { categoria: 'objetivos', url: '/docs/ejemplo_capacitacion.pdf', nombre: 'Objetivos y Beneficios' },
    { categoria: 'phva', url: '/docs/ejemplo_capacitacion.pdf', nombre: 'Ciclo PHVA' },
    { categoria: 'organizacion', url: '/docs/ejemplo_capacitacion.pdf', nombre: 'Organización' }
    // Agrega más según necesites
  ];
  res.json(list);
});

// Subir archivo aplicado por usuario (cualquier tipo)
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  const { categoria, empresa_id } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
  const db = getDb();
  db.run(`INSERT INTO archivos_capacitacion (usuario_id, empresa_id, categoria, ruta_archivo, nombre_original)
    VALUES (?,?,?,?,?)`, [req.user.id_usuario, empresa_id || null, categoria, `/uploads/${req.file.filename}`, req.file.originalname],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ error: 'Error guardando registro', detail: err.message });
      res.json({ message: 'Archivo subido', id_archivo: this.lastID, ruta: `/uploads/${req.file.filename}` });
    });
});

// Listar archivos subidos por el usuario
router.get('/myfiles', authenticateToken, (req, res) => {
  const db = getDb();
  db.all(`SELECT * FROM archivos_capacitacion WHERE usuario_id = ? ORDER BY fecha_subida DESC`, [req.user.id_usuario], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: 'Error DB' });
    res.json(rows);
  });
});

module.exports = router;
