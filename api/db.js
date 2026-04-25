// Conexion a la base de datos PostgreSQL
const pg     = require('pg');
const dotenv = require('dotenv');

dotenv.config(); // carga las variables del archivo .env

// Pool de conexiones — reutiliza conexiones en vez de abrir una nueva cada vez
const conexion = new pg.Pool({
  user:                    process.env.DB_USER     || 'postgres',
  host:                    process.env.DB_HOST     || 'localhost',
  database:                process.env.DB_NAME     || 'directorio_db',
  password:                process.env.DB_PASSWORD || '',
  port:                    process.env.DB_PORT     || 5432,
  max:                     20,    // maximo 20 conexiones simultaneas
  idleTimeoutMillis:       30000, // cierra conexiones inactivas despues de 30s
  connectionTimeoutMillis: 2000,  // error si no conecta en 2s
});

// Funcion que ejecuta una consulta SQL
// texto  = el SQL a ejecutar, ej: 'SELECT * FROM tabla WHERE id=$1'
// valores = los datos que reemplazan los $1, $2... para evitar inyecciones SQL
function hacerConsulta(texto, valores) {
  return conexion.query(texto, valores);
}

module.exports = { query: hacerConsulta };