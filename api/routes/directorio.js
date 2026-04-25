// CRUD para Directorio de Entes
// Jerarquia: Secretaria -> Subsecretaria -> Ente
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Convierte la lista plana de la BD en un arbol jerarquico
function construirArbol(filas) {
  const mapa = {};
  const raiz = [];

  // Primero indexamos todas las filas por su id
  filas.forEach(f => { mapa[f.id] = { ...f, subsecretarias: [], entes: [] }; });

  // Luego acomodamos cada fila en su lugar del arbol
  filas.forEach(f => {
    if (f.parent_id && mapa[f.parent_id]) {
      if (f.tipo === 'Subsecretaria') mapa[f.parent_id].subsecretarias.push(mapa[f.id]);
      else if (f.tipo === 'Ente')     mapa[f.parent_id].entes.push(mapa[f.id]);
    } else {
      raiz.push(mapa[f.id]); // sin padre = es una Secretaria
    }
  });

  return raiz;
}

// GET — devuelve el arbol completo
router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM directorio_entes ORDER BY codigo');
    res.json({ data: construirArbol(r.rows) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — crea una nueva entidad
router.post('/', async (req, res) => {
  try {
    const { codigo, nombre, tipo, parent_id, presupuesto, descripcion } = req.body;
    const r = await db.query(
      'INSERT INTO directorio_entes (codigo, nombre, tipo, parent_id, presupuesto, descripcion) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [codigo, nombre, tipo || 'Secretaria', parent_id || null, presupuesto || 0, descripcion || '']
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT — actualiza una entidad por id
router.put('/:id', async (req, res) => {
  try {
    const { codigo, nombre, tipo, parent_id, presupuesto, descripcion } = req.body;
    const r = await db.query(
      'UPDATE directorio_entes SET codigo=$1, nombre=$2, tipo=$3, parent_id=$4, presupuesto=$5, descripcion=$6 WHERE id=$7 RETURNING *',
      [codigo, nombre, tipo, parent_id || null, presupuesto || 0, descripcion || '', req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — elimina una entidad por id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM directorio_entes WHERE id=$1', [req.params.id]);
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
