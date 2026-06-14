const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/patients
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM patients ${whereClause}`, params);
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM patients ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ patients: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Fetch Patients Error:', err);
    res.status(500).json({ error: 'Failed to fetch patients', details: err.message });
  }
});

// GET /api/patients/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Patient not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// POST /api/patients
router.post('/', authenticate, async (req, res) => {
  try {
    const { full_name, gender, date_of_birth, phone, email, address, medical_history, blood_group, status = 'active' } = req.body;
    if (!full_name) return res.status(400).json({ error: 'Full name is required' });

    const [result] = await pool.query(
      'INSERT INTO patients (full_name, gender, date_of_birth, phone, email, address, medical_history, blood_group, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [full_name, gender || null, date_of_birth || null, phone || null, email || null, address || null, medical_history || null, blood_group || null, status]
    );
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// PUT /api/patients/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { full_name, gender, date_of_birth, phone, email, address, medical_history, blood_group, status } = req.body;
    await pool.query(
      'UPDATE patients SET full_name=?, gender=?, date_of_birth=?, phone=?, email=?, address=?, medical_history=?, blood_group=?, status=? WHERE id=?',
      [full_name, gender || null, date_of_birth || null, phone || null, email || null, address || null, medical_history || null, blood_group || null, status || 'active', req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Patient not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM patients WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

module.exports = router;
