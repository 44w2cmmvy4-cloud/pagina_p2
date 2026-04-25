// Servidor principal — registra las rutas y arranca Express
const express = require('express');
const cors    = require('cors');

const rutaDirectorio    = require('./routes/directorio');
const rutaClasificacion = require('./routes/clasificacion');
const rutaIngresos      = require('./routes/ingresos');
const rutaProgramas     = require('./routes/programas');

const app = express();

app.use(cors());         // permite conexiones desde la pagina web
app.use(express.json()); // permite recibir datos en formato JSON

// Rutas disponibles en la API
app.use('/api/directorio',    rutaDirectorio);
app.use('/api/clasificacion', rutaClasificacion);
app.use('/api/ingresos',      rutaIngresos);
app.use('/api/programas',     rutaProgramas);

// Ruta de prueba para verificar que el servidor esta activo
app.get('/api/estado', (req, res) => {
  res.json({ estado: 'activo', version: '2.0' });
});

const PUERTO = process.env.PORT || 5000;

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
