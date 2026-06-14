const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/departments
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, COUNT(doc.id) as doctor_count
       FROM departments d LEFT JOIN doctors doc ON doc.department_id = d.id
       GROUP BY d.id ORDER BY d.name`
    );
    res.json({ departments: rows, total: rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /api/departments
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required' });

    const [result] = await pool.query('INSERT INTO departments (name, description) VALUES (?, ?)', [name, description || null]);
    const [rows] = await pool.query('SELECT * FROM departments WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Department name already exists' });
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PUT /api/departments/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    await pool.query('UPDATE departments SET name=?, description=? WHERE id=?', [name, description || null, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM departments WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Department not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE /api/departments/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

module.exports = router;
