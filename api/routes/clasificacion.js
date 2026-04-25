// CRUD para Clasificacion Funcional
// Tablas: clas_finalidad -> clas_funcion -> clas_subfuncion
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Construye la jerarquia completa leyendo las 3 tablas
async function obtenerJerarquia() {
  const finalidades  = await db.query('SELECT * FROM clas_finalidad ORDER BY id');
  const funciones    = await db.query('SELECT * FROM clas_funcion ORDER BY codigo');
  const subfunciones = await db.query('SELECT * FROM clas_subfuncion ORDER BY codigo');

  return finalidades.rows.map(fin => ({
    ...fin,
    nivel: 'Finalidad',
    funciones: funciones.rows
      .filter(fn => fn.finalidad_id === fin.id)
      .map(fn => ({
        ...fn,
        nivel: 'Funcion',
        parent_id: fin.id,
        subfunciones: subfunciones.rows
          .filter(sub => sub.funcion_id === fn.id)
          .map(sub => ({ ...sub, nivel: 'Subfuncion', parent_id: fn.id }))
      }))
  }));
}

// Detecta en cual de las 3 tablas esta un id
async function buscarTabla(id) {
  let r = await db.query('SELECT id FROM clas_finalidad WHERE id=$1', [id]);
  if (r.rows[0]) return 'clas_finalidad';

  r = await db.query('SELECT id FROM clas_funcion WHERE id=$1', [id]);
  if (r.rows[0]) return 'clas_funcion';

  r = await db.query('SELECT id FROM clas_subfuncion WHERE id=$1', [id]);
  if (r.rows[0]) return 'clas_subfuncion';

  return null; // no existe en ninguna tabla
}

// GET — jerarquia completa
router.get('/', async (req, res) => {
  try {
    res.json({ data: await obtenerJerarquia() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — inserta en la tabla correcta segun el nivel
router.post('/', async (req, res) => {
  try {
    const { codigo, nombre, descripcion, nivel, parent_id } = req.body;

    let tabla, campos, valores;

    if (nivel === 'Finalidad') {
      tabla  = 'clas_finalidad';
      campos = '(codigo, nombre, descripcion)';
      valores = [codigo, nombre, descripcion];
    } else if (nivel === 'Funcion') {
      tabla  = 'clas_funcion';
      campos = '(codigo, nombre, descripcion, finalidad_id)';
      valores = [codigo, nombre, descripcion, parent_id];
    } else if (nivel === 'Subfuncion') {
      tabla  = 'clas_subfuncion';
      campos = '(codigo, nombre, descripcion, funcion_id)';
      valores = [codigo, nombre, descripcion, parent_id];
    } else {
      return res.status(400).json({ error: 'Nivel invalido' });
    }

    const params = valores.map((_, i) => `$${i + 1}`).join(', ');
    const r = await db.query(`INSERT INTO ${tabla} ${campos} VALUES (${params}) RETURNING *`, valores);
    res.json({ ...r.rows[0], nivel, parent_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT — actualiza el registro en la tabla que corresponda
router.put('/:id', async (req, res) => {
  try {
    const { codigo, nombre, descripcion, nivel, parent_id } = req.body;
    const tabla = await buscarTabla(req.params.id);
    if (!tabla) return res.status(404).json({ error: 'No encontrado' });

    let sql, valores;

    if (tabla === 'clas_finalidad') {
      sql    = 'UPDATE clas_finalidad SET codigo=$1, nombre=$2, descripcion=$3 WHERE id=$4 RETURNING *';
      valores = [codigo, nombre, descripcion, req.params.id];
    } else if (tabla === 'clas_funcion') {
      sql    = 'UPDATE clas_funcion SET codigo=$1, nombre=$2, descripcion=$3, finalidad_id=$4 WHERE id=$5 RETURNING *';
      valores = [codigo, nombre, descripcion, parent_id, req.params.id];
    } else {
      sql    = 'UPDATE clas_subfuncion SET codigo=$1, nombre=$2, descripcion=$3, funcion_id=$4 WHERE id=$5 RETURNING *';
      valores = [codigo, nombre, descripcion, parent_id, req.params.id];
    }

    const r = await db.query(sql, valores);
    res.json({ ...r.rows[0], nivel, parent_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — intenta eliminar el id de las 3 tablas
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM clas_subfuncion WHERE id=$1', [req.params.id]);
    await db.query('DELETE FROM clas_funcion    WHERE id=$1', [req.params.id]);
    await db.query('DELETE FROM clas_finalidad  WHERE id=$1', [req.params.id]);
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
