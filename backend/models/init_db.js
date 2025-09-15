const { getDb } = require('../config/db');
const bcrypt = require('bcrypt');

function run(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => (err ? reject(err) : resolve()));
  });
}

async function init() {
  const db = getDb();

  // Wrap en Promise para secuenciar creación
  await new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Empresas
        await run(db, `CREATE TABLE IF NOT EXISTS empresas (
          id_empresa INTEGER PRIMARY KEY AUTOINCREMENT,
          razon_social TEXT,
          nit TEXT,
          representante_legal TEXT,
          sector_economico TEXT,
          tipo_empresa TEXT,
          direccion TEXT,
          telefono TEXT,
          num_empleados INTEGER,
          email TEXT,
          web TEXT,
          facebook TEXT,
          instagram TEXT,
          tiktok TEXT
        )`);

        // Usuarios
        await run(db, `CREATE TABLE IF NOT EXISTS usuarios (
          id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT,
          correo TEXT UNIQUE,
          password TEXT,
          empresa_id INTEGER,
          FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa)
        )`);

        // Checklist (cabecera)
        await run(db, `CREATE TABLE IF NOT EXISTS checklist (
          id_checklist INTEGER PRIMARY KEY AUTOINCREMENT,
          fecha_aplicacion TEXT,
          implementador TEXT,
          empresa_id INTEGER,
          usuario_id INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa),
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
        )`);

        // Items del checklist
        await run(db, `CREATE TABLE IF NOT EXISTS checklist_items (
          id_item INTEGER PRIMARY KEY AUTOINCREMENT,
          id_checklist INTEGER,
          numero_item TEXT,
          estado TEXT,
          comentario TEXT,
          FOREIGN KEY (id_checklist) REFERENCES checklist(id_checklist)
        )`);

        // Archivos de capacitacion
        await run(db, `CREATE TABLE IF NOT EXISTS archivos_capacitacion (
          id_archivo INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario_id INTEGER,
          empresa_id INTEGER,
          categoria TEXT,
          ruta_archivo TEXT,
          nombre_original TEXT,
          fecha_subida TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario),
          FOREIGN KEY (empresa_id) REFERENCES empresas(id_empresa)
        )`);

        // Tabla de puntajes rapidos (opcional, se puede llenar tras calcular)
        await run(db, `CREATE TABLE IF NOT EXISTS auditoria_summary (
          id_summary INTEGER PRIMARY KEY AUTOINCREMENT,
          id_checklist INTEGER,
          porcentaje REAL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_checklist) REFERENCES checklist(id_checklist)
        )`);

        // Crear una empresa ficticia y usuario por defecto si no existen
        db.get(`SELECT COUNT(*) as cnt FROM usuarios`, async (err, row) => {
          if (err) throw err;
          if (row.cnt === 0) {
            // Crear empresa por defecto
            const insertEmpresaSql = `INSERT INTO empresas (razon_social,nit,representante_legal,sector_economico,tipo_empresa,direccion,telefono,num_empleados,email,web,facebook,instagram,tiktok)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
            const empresaValues = [
              'Empresa Usuaria S.A.S',
              '900123456-7',
              'Juan ',
              'Servicios',
              'PyME',
              'Calle 13',
              '3000000000',
              15,
              'demo@empresa.com',
              'https://demo.example',
              'fb/demo',
              'ig/demo',
              'tt/demo'
            ];
            db.run(insertEmpresaSql, empresaValues, function (err2) {
              if (err2) throw err2;
              const empresaId = this.lastID;
              // Crear usuario por defecto con password 'demo1234'
              bcrypt.hash('demo1234', 10, (errb, hash) => {
                if (errb) throw errb;
                const insertUserSql = `INSERT INTO usuarios (nombre, correo, password, empresa_id)
                  VALUES (?,?,?,?)`;
                db.run(insertUserSql, ['Usuario Demo', 'demo@empresa.com', hash, empresaId], (er) => {
                  if (er) throw er;
                  console.log('Usuario por defecto creado: demo@empresa.com / demo1234');
                  resolve();
                });
              });
            });
          } else {
            resolve();
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  });

  db.close();
}

module.exports = init;
