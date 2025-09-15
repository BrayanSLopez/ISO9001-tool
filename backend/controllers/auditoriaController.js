const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Obtener historial con puntajes + items
router.get('/history', authenticateToken, (req, res) => {
  const db = getDb();
  db.all(
    `SELECT * FROM checklist WHERE usuario_id = ? ORDER BY created_at DESC`,
    [req.user.id_usuario],
    (err, rows) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Error DB' });
      }

      const promises = rows.map(
        (row) =>
          new Promise((resolve, reject) => {
            db.all(
              `SELECT numero_item, estado, comentario FROM checklist_items WHERE id_checklist = ?`,
              [row.id_checklist],
              (err2, items) => {
                if (err2) return reject(err2);

                // calcular puntaje: Cumple=100, En proceso=50, No cumple=0 (promedio)
                if (!items || items.length === 0)
                  return resolve({ ...row, porcentaje: 0, items: [] });

                let total = 0;
                for (const it of items) {
                  if (it.estado === 'Cumple') total += 100;
                  else if (it.estado === 'En proceso') total += 50;
                  else total += 0;
                }
                const porcentaje = total / items.length;

                resolve({
                  ...row,
                  porcentaje: Math.round(porcentaje * 100) / 100,
                  items,
                });
              }
            );
          })
      );

      Promise.all(promises)
        .then((results) => {
          db.close();
          res.json(results);
        })
        .catch((e) => {
          db.close();
          res
            .status(500)
            .json({ error: 'Error calculando puntajes', detail: e.message });
        });
    }
  );
});

module.exports = router;

