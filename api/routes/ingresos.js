// CRUD para Catalogo de Ingresos
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET — todos los ingresos
router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM catalogo_ingresos ORDER BY codigo');
    res.json({ data: r.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — crea un ingreso
router.post('/', async (req, res) => {
  try {
    const { codigo, nombre, descripcion, tipo_ingreso, fuente_financiamiento,
            cve_ff, cve_ldf, nivel, parent_id, monto_estimado, anio } = req.body;

    const r = await db.query(
      `INSERT INTO catalogo_ingresos
         (codigo, nombre, descripcion, tipo_ingreso, fuente_financiamiento,
          cve_ff, cve_ldf, nivel, parent_id, monto_estimado, anio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [codigo, nombre, descripcion, tipo_ingreso, fuente_financiamiento,
       cve_ff, cve_ldf, nivel, parent_id || null, monto_estimado || 0, anio]
    );
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT — actualiza un ingreso por id
router.put('/:id', async (req, res) => {
  try {
    const { codigo, nombre, descripcion, tipo_ingreso, fuente_financiamiento,
            cve_ff, cve_ldf, nivel, parent_id, monto_estimado, anio } = req.body;

    const r = await db.query(
      `UPDATE catalogo_ingresos SET
         codigo=$1, nombre=$2, descripcion=$3, tipo_ingreso=$4,
         fuente_financiamiento=$5, cve_ff=$6, cve_ldf=$7, nivel=$8,
         parent_id=$9, monto_estimado=$10, anio=$11
       WHERE id=$12 RETURNING *`,
      [codigo, nombre, descripcion, tipo_ingreso, fuente_financiamiento,
       cve_ff, cve_ldf, nivel, parent_id || null, monto_estimado || 0, anio, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — elimina un ingreso por id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM catalogo_ingresos WHERE id=$1', [req.params.id]);
    res.json({ message: 'Eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
