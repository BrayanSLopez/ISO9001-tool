# ISO9001 Tool 

Repositorio demo para una herramienta de implementación, capacitación y auditoría de la norma ISO 9001.

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
(ver listado en la descripción del repo)

## Notas
- Archivos subidos por usuarios se almacenan en `backend/uploads`.
- Documentos base para descarga se guardan en `docs/`.
- Autenticación con JWT (token válido 12 horas).
