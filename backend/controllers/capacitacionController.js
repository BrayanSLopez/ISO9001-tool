const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Configuración Multer
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

// Documentos base (estáticos en /docs)
router.get('/docs', (req, res) => {
  const list = [
    { categoria: 'objetivos', url: '/docs/Organigrama+Formato.xlsx', nombre: 'Objetivos y Beneficios' },
    { categoria: 'phva', url: '/docs/Organigrama+Formato.xlsx', nombre: 'Ciclo PHVA' },
    { categoria: 'organizacion', url: '/docs/Organigrama+Formato.xlsx', nombre: 'Organización' }
  ];
  res.json(list);
});

// Subir o reemplazar archivo de capacitación
router.put('/upload', authenticateToken, upload.single('file'), (req, res) => {
  const { categoria, empresa_id } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

  const db = getDb();

  // Buscar si ya existe un archivo para ese usuario y categoría
  db.get(
    `SELECT * FROM archivos_capacitacion WHERE usuario_id = ? AND categoria = ?`,
    [req.user.id_usuario, categoria],
    (err, row) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Error DB', detail: err.message });
      }

      // Si existe, borrar archivo físico y actualizar registro
      if (row) {
        const oldPath = path.join(__dirname, '..', row.ruta_archivo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

        db.run(
          `UPDATE archivos_capacitacion 
           SET ruta_archivo = ?, nombre_original = ?, fecha_subida = CURRENT_TIMESTAMP, empresa_id = ? 
           WHERE id_archivo = ?`,
          [`/uploads/${req.file.filename}`, req.file.originalname, empresa_id || null, row.id_archivo],
          function (err2) {
            db.close();
            if (err2) return res.status(500).json({ error: 'Error actualizando archivo', detail: err2.message });
            return res.json({ message: 'Archivo actualizado', fileUrl: `/uploads/${req.file.filename}`, fileName: req.file.originalname });
          }
        );
      } else {
        // Si no existe, insertar nuevo registro
        db.run(
          `INSERT INTO archivos_capacitacion (usuario_id, empresa_id, categoria, ruta_archivo, nombre_original) 
           VALUES (?,?,?,?,?)`,
          [req.user.id_usuario, empresa_id || null, categoria, `/uploads/${req.file.filename}`, req.file.originalname],
          function (err3) {
            db.close();
            if (err3) return res.status(500).json({ error: 'Error guardando archivo', detail: err3.message });
            return res.json({ message: 'Archivo subido', fileUrl: `/uploads/${req.file.filename}`, fileName: req.file.originalname });
          }
        );
      }
    }
  );
});

// Listar archivos del usuario
router.get('/myfiles', authenticateToken, (req, res) => {
  const db = getDb();
  db.all(`SELECT * FROM archivos_capacitacion WHERE usuario_id = ? ORDER BY fecha_subida DESC`, [req.user.id_usuario], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: 'Error DB' });
    res.json(rows);
  });
});

module.exports = router;

