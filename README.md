# ISO9001 Tool 

Repositorio demo para una herramienta de implementación, capacitación y auditoría de la norma ISO 9001.

## Características principales

- Gestión de auditorías internas y externas.
- Módulo de capacitación para usuarios.
- Listas de verificación (checklists) para cumplimiento de requisitos.
- Descarga y almacenamiento de documentos base (Excel, PDF, imágenes).
- Autenticación de usuarios con JWT.
- Panel de control (dashboard) para visualización rápida.
- Subida y gestión de archivos por usuario.
- Backend en Node.js y frontend HTML estático.

## Requisitos
- Node.js >= 16
- npm

## Instalar y ejecutar
1. `npm install node`
1.1 `node backend/app.js`
2. Copia `.env.example` a `.env` y ajusta si quieres.
3. `npm start`
4. El backend correrá en `http://localhost:4000` por defecto.
5. Abre los archivos estáticos en `frontend/` (por ejemplo, con live server o sirviéndolos desde un simple static server). Si abres los HTML directamente, asegúrate que `fetch` apunte al mismo host/puerto donde corre el backend (por defecto se asume mismo host).

## Usuario por defecto
- correo: `demo@empresa.com`
- contraseña: `demo1234`

## Estructura

La estructura del proyecto es la siguiente:

```
ISO9001-tool/
├── backend/
│   ├── app.js
│   ├── database.sqlite
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── auditoriaController.js
│   │   ├── authController.js
│   │   ├── capacitacionController.js
│   │   └── checklistController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   └── init_db.js
│   └── uploads/
│       ├── 1757965266130-192582405-auditoria_1.pdf
│       └── 1757982681771-313850879-Objetivos.xlsx
├── docs/
│   ├── Apoyo.xlsx
│   ├── Auditoria.xlsx
│   ├── Desempeno.xlsx
│   ├── Liderazgo.xlsx
│   ├── Mejora.xlsx
│   ├── Objetivos.xlsx
│   ├── Operacion.xlsx
│   ├── Organigrama.xlsx
│   ├── PHVA.jpg
│   └── Planificacion.xlsx
├── frontend/
│   ├── auditoria.html
│   ├── capacitacion.html
│   ├── checklist.html
│   ├── dashboard.html
│   ├── index.html
│   └── assets/
│       └── bg.jpg
├── README.md
└── .gitignore
```

## Notas
- Archivos subidos por usuarios se almacenan en `backend/uploads`.
- Documentos base para descarga se guardan en `docs/`.
- Autenticación con JWT (token válido 12 horas).
