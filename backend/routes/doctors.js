const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/doctors
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', department_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (d.name LIKE ? OR d.specialization LIKE ? OR d.email LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (status) { whereClause += ' AND d.status = ?'; params.push(status); }
    if (department_id) { whereClause += ' AND d.department_id = ?'; params.push(department_id); }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM doctors d ${whereClause}`, params);
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT d.*, dept.name as department_name FROM doctors d
       LEFT JOIN departments dept ON d.department_id = dept.id
       ${whereClause} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ doctors: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// GET /api/doctors/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, dept.name as department_name FROM doctors d
       LEFT JOIN departments dept ON d.department_id = dept.id WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Doctor not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

// POST /api/doctors
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, specialization, email, phone, department_id, status = 'active' } = req.body;
    if (!name || !specialization) return res.status(400).json({ error: 'Name and specialization are required' });

    const [result] = await pool.query(
      'INSERT INTO doctors (name, specialization, email, phone, department_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, specialization, email || null, phone || null, department_id || null, status]
    );
    const [rows] = await pool.query(
      `SELECT d.*, dept.name as department_name FROM doctors d LEFT JOIN departments dept ON d.department_id = dept.id WHERE d.id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create doctor' });
  }
});

// PUT /api/doctors/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, specialization, email, phone, department_id, status } = req.body;
    await pool.query(
      'UPDATE doctors SET name=?, specialization=?, email=?, phone=?, department_id=?, status=? WHERE id=?',
      [name, specialization, email || null, phone || null, department_id || null, status || 'active', req.params.id]
    );
    const [rows] = await pool.query(
      `SELECT d.*, dept.name as department_name FROM doctors d LEFT JOIN departments dept ON d.department_id = dept.id WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Doctor not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

// DELETE /api/doctors/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM doctors WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

module.exports = router;
