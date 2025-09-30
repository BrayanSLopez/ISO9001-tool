require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const initDb = require('./models/init_db');
const authRoutes = require('./controllers/authController');
const checklistRoutes = require('./controllers/checklistController');
const capacitacionRoutes = require('./controllers/capacitacionController');
const auditoriaRoutes = require('./controllers/auditoriaController');

const app = express();

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 👉 Carpeta estática para frontend completo
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// 👉 Carpeta para archivos subidos y docs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/docs', express.static(path.join(__dirname, '..', 'docs')));

// Inicializar DB y crear tablas + usuario por defecto
initDb()
  .then(() => console.log('DB inicializada'))
  .catch((err) => {
    console.error('Error inicializando DB', err);
    process.exit(1);
  });

// 👉 Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/capacitacion', capacitacionRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// 👉 Endpoint simple de salud
app.get('/api/health', (req, res) => {
  res.json({ message: 'ISO9001 tool backend activo' });
});

// 👉 Si no es API, devolver index.html (para frontend)
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server escuchando en http://localhost:${PORT}`);
});
