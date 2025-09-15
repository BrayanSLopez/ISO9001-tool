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
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Categorías fijas
const categorias = [
  { categoria: 'objetivos', nombre: 'Objetivos y Beneficios' },
  { categoria: 'phva', nombre: 'Ciclo PHVA' },
  { categoria: 'organizacion', nombre: 'Organización' },
  { categoria: 'liderazgo', nombre: 'Liderazgo' },
  { categoria: 'planificacion', nombre: 'Planificación' },
  { categoria: 'apoyo', nombre: 'Apoyo' },
  { categoria: 'operacion', nombre: 'Operación' },
  { categoria: 'desempeno', nombre: 'Desempeño' },
  { categoria: 'mejora', nombre: 'Mejora' },
  { categoria: 'auditoria', nombre: 'Auditoría' }
];

// Documentos base
router.get('/docs', (req, res) => {
  const list = categorias.map(c => ({
    categoria: c.categoria,
    url: '/docs/Organigrama+Formato.xlsx',
    nombre: c.nombre
  }));
  res.json(list);
});

// Subir o reemplazar archivo
router.put('/upload', authenticateToken, upload.single('file'), (req, res) => {
  const { categoria, empresa_id } = req.body;
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

  const db = getDb();

  db.get(
    `SELECT * FROM archivos_capacitacion WHERE usuario_id = ? AND categoria = ?`,
    [req.user.id_usuario, categoria],
    (err, row) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Error DB', detail: err.message });
      }

      if (row) {
        const oldPath = path.join(__dirname, '..', row.ruta_archivo);
        try {
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) {
          console.warn('No se pudo eliminar archivo anterior:', e.message);
        }

        db.run(
          `UPDATE archivos_capacitacion 
           SET ruta_archivo = ?, nombre_original = ?, fecha_subida = CURRENT_TIMESTAMP, empresa_id = ? 
           WHERE id_archivo = ?`,
          [`/uploads/${req.file.filename}`, req.file.originalname, empresa_id || null, row.id_archivo],
          function (err2) {
            db.close();
            if (err2) return res.status(500).json({ error: 'Error actualizando archivo', detail: err2.message });
            return res.json({
              message: 'Archivo actualizado',
              fileUrl: `/uploads/${req.file.filename}`,
              fileName: req.file.originalname
            });
          }
        );
      } else {
        db.run(
          `INSERT INTO archivos_capacitacion (usuario_id, empresa_id, categoria, ruta_archivo, nombre_original) 
           VALUES (?,?,?,?,?)`,
          [req.user.id_usuario, empresa_id || null, categoria, `/uploads/${req.file.filename}`, req.file.originalname],
          function (err3) {
            db.close();
            if (err3) return res.status(500).json({ error: 'Error guardando archivo', detail: err3.message });
            return res.json({
              message: 'Archivo subido',
              fileUrl: `/uploads/${req.file.filename}`,
              fileName: req.file.originalname
            });
          }
        );
      }
    }
  );
});

// Archivos del usuario
router.get('/myfiles', authenticateToken, (req, res) => {
  const db = getDb();
  db.all(
    `SELECT * FROM archivos_capacitacion WHERE usuario_id = ? ORDER BY fecha_subida DESC`,
    [req.user.id_usuario],
    (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: 'Error DB', detail: err.message });
      res.json(rows);
    }
  );
});

// ✅ Historial de auditorías (con ítems incluidos)
router.get('/history', authenticateToken, (req, res) => {
  const db = getDb();
  const sql = `
    SELECT c.id_checklist,
           c.fecha_aplicacion,
           c.implementador,
           s.porcentaje
    FROM checklist c
    LEFT JOIN auditoria_summary s ON c.id_checklist = s.id_checklist
    WHERE c.usuario_id = ?
    ORDER BY c.fecha_aplicacion DESC
  `;
  db.all(sql, [req.user.id_usuario], (err, audits) => {
    if (err) {
      db.close();
      console.error('Error al consultar historial:', err);
      return res.status(500).json({ error: 'Error DB', detail: err.message });
    }

    if (!audits || audits.length === 0) {
      db.close();
      return res.json([]);
    }

    const ids = audits.map(a => a.id_checklist);
    const sqlItems = `
      SELECT id_item, id_checklist, numero_item, estado, comentario
      FROM checklist_items
      WHERE id_checklist IN (${ids.map(() => '?').join(',')})
    `;
    db.all(sqlItems, ids, (err2, items) => {
      db.close();
      if (err2) return res.status(500).json({ error: 'Error DB items', detail: err2.message });

      const grouped = {};
      items.forEach(it => {
        if (!grouped[it.id_checklist]) grouped[it.id_checklist] = [];
        grouped[it.id_checklist].push(it);
      });

      const result = audits.map(a => ({
        ...a,
        items: grouped[a.id_checklist] || []
      }));

      res.json(result);
    });
  });
});

// ✅ Insertar o actualizar resumen de auditoría
router.post('/summary', authenticateToken, (req, res) => {
  const { id_checklist, porcentaje } = req.body;
  if (!id_checklist || porcentaje === undefined) {
    return res.status(400).json({ error: 'id_checklist y porcentaje requeridos' });
  }

  const db = getDb();

  db.get(
    `SELECT id_summary FROM auditoria_summary WHERE id_checklist = ?`,
    [id_checklist],
    (err, row) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Error DB', detail: err.message });
      }

      if (row) {
        db.run(
          `UPDATE auditoria_summary 
           SET porcentaje = ?, created_at = CURRENT_TIMESTAMP 
           WHERE id_summary = ?`,
          [porcentaje, row.id_summary],
          function (err2) {
            db.close();
            if (err2) return res.status(500).json({ error: 'Error actualizando resumen', detail: err2.message });
            res.json({ message: 'Resumen actualizado', id_summary: row.id_summary });
          }
        );
      } else {
        db.run(
          `INSERT INTO auditoria_summary (id_checklist, porcentaje) VALUES (?, ?)`,
          [id_checklist, porcentaje],
          function (err3) {
            db.close();
            if (err3) return res.status(500).json({ error: 'Error insertando resumen', detail: err3.message });
            res.json({ message: 'Resumen guardado', id_summary: this.lastID });
          }
        );
      }
    }
  );
});

module.exports = router;





