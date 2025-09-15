const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Crear nuevo checklist (cabecera + items)
router.post('/create', authenticateToken, (req, res) => {
  const { fecha_aplicacion, implementador, empresa_id, items } = req.body;
  // items: [{ numero_item: "4.0", estado:"Cumple", comentario:"" }, ...]
  const db = getDb();
  db.run(`INSERT INTO checklist (fecha_aplicacion, implementador, empresa_id, usuario_id) VALUES (?,?,?,?)`,
    [fecha_aplicacion, implementador, empresa_id, req.user.id_usuario],
    function (err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Error creando checklist', detail: err.message });
      }
      const checklistId = this.lastID;
      const stmt = db.prepare(`INSERT INTO checklist_items (id_checklist, numero_item, estado, comentario) VALUES (?,?,?,?)`);
      for (const it of items) {
        stmt.run([checklistId, it.numero_item, it.estado, it.comentario || null]);
      }
      stmt.finalize((e) => {
        db.close();
        if (e) return res.status(500).json({ error: 'Error guardando items', detail: e.message });
        res.json({ message: 'Checklist guardado', id_checklist: checklistId });
      });
    });
});

// Obtener checklist por usuario (historial)
router.get('/my', authenticateToken, (req, res) => {
  const db = getDb();
  db.all(`SELECT * FROM checklist WHERE usuario_id = ? ORDER BY created_at DESC`, [req.user.id_usuario], (err, rows) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Error DB' });
    }
    // Por cada row, traer items
    const promises = rows.map(row => new Promise((resolve, reject) => {
      db.all(`SELECT * FROM checklist_items WHERE id_checklist = ?`, [row.id_checklist], (err2, items) => {
        if (err2) reject(err2);
        else resolve({ ...row, items });
      });
    }));
    Promise.all(promises)
      .then(results => {
        db.close();
        res.json(results);
      })
      .catch(e => {
        db.close();
        res.status(500).json({ error: 'Error cargando items', detail: e.message });
      });
  });
});

module.exports = router;
