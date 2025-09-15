const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, '..', 'database.sqlite');

function getDb() {
  // Asegurarnos que la carpeta exista
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new sqlite3.Database(DB_FILE);
  return db;
}

module.exports = { getDb, DB_FILE };
