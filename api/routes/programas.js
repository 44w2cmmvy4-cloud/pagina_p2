// CRUD para Programas y Proyectos
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET — todos los programas
router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM programas_proyectos ORDER BY codigo');
    res.json({ data: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — crea un programa
router.post('/', async (req, res) => {
  try {
    const { codigo, nombre, descripcion, tipo,
            ente_responsable_id, clasificacion_id,
            monto_total, monto_ejercido,
            fecha_inicio, fecha_fin, estatus,
            meta_valor, meta_unidad, ods_codigo,
            beneficiarios, observaciones } = req.body;

    const r = await db.query(
      `INSERT INTO programas_proyectos
         (codigo, nombre, descripcion, tipo,
          ente_responsable_id, clasificacion_id,
          monto_total, monto_ejercido,
          fecha_inicio, fecha_fin, estatus,
          meta_valor, meta_unidad, ods_codigo,
          beneficiarios, observaciones)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [codigo, nombre, descripcion, tipo,
       ente_responsable_id || null, clasificacion_id || null,
       monto_total || 0,  monto_ejercido || 0,
       fecha_inicio || null, fecha_fin || null, estatus || '',
       meta_valor || 0, meta_unidad || '', ods_codigo || '',
       beneficiarios || '', observaciones || '']
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT — actualiza un programa por id
router.put('/:id', async (req, res) => {
  try {
    const { codigo, nombre, descripcion, tipo,
            ente_responsable_id, clasificacion_id,
            monto_total, monto_ejercido,
            fecha_inicio, fecha_fin, estatus,
            meta_valor, meta_unidad, ods_codigo,
            beneficiarios, observaciones } = req.body;

    const r = await db.query(
      `UPDATE programas_proyectos SET
         codigo=$1, nombre=$2, descripcion=$3, tipo=$4,
         ente_responsable_id=$5, clasificacion_id=$6,
         monto_total=$7, monto_ejercido=$8,
         fecha_inicio=$9, fecha_fin=$10, estatus=$11,
         meta_valor=$12, meta_unidad=$13, ods_codigo=$14,
         beneficiarios=$15, observaciones=$16
       WHERE id=$17 RETURNING *`,
      [codigo, nombre, descripcion, tipo,
       ente_responsable_id || null, clasificacion_id || null,
       monto_total || 0, monto_ejercido || 0,
       fecha_inicio || null, fecha_fin || null, estatus || '',
       meta_valor || 0, meta_unidad || '', ods_codigo || '',
       beneficiarios || '', observaciones || '',
       req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — elimina un programa por id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM programas_proyectos WHERE id=$1', [req.params.id]);
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
