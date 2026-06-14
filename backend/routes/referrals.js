const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const referralSelect = `
  SELECT r.*,
    p.full_name as patient_name,
    rd.name as referring_doctor_name,
    recv.name as receiving_doctor_name,
    dept.name as department_name
  FROM referrals r
  LEFT JOIN patients p ON r.patient_id = p.id
  LEFT JOIN doctors rd ON r.referring_doctor_id = rd.id
  LEFT JOIN doctors recv ON r.receiving_doctor_id = recv.id
  LEFT JOIN departments dept ON r.department_id = dept.id
`;

// GET /api/referrals
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', priority = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) { whereClause += ' AND r.status = ?'; params.push(status); }
    if (priority) { whereClause += ' AND r.priority = ?'; params.push(priority); }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM referrals r ${whereClause}`, params);
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `${referralSelect} ${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ referrals: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// GET /api/referrals/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`${referralSelect} WHERE r.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Referral not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch referral' });
  }
});

// POST /api/referrals
router.post('/', authenticate, async (req, res) => {
  try {
    const { patient_id, referring_doctor_id, receiving_doctor_id, department_id, status = 'pending', priority = 'normal', reason, notes } = req.body;
    if (!patient_id || !referring_doctor_id || !reason) {
      return res.status(400).json({ error: 'Patient, referring doctor, and reason are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO referrals (patient_id, referring_doctor_id, receiving_doctor_id, department_id, status, priority, reason, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [patient_id, referring_doctor_id, receiving_doctor_id || null, department_id || null, status, priority, reason, notes || null]
    );
    const [rows] = await pool.query(`${referralSelect} WHERE r.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

// PUT /api/referrals/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { patient_id, referring_doctor_id, receiving_doctor_id, department_id, status, priority, reason, notes } = req.body;
    await pool.query(
      'UPDATE referrals SET patient_id=?, referring_doctor_id=?, receiving_doctor_id=?, department_id=?, status=?, priority=?, reason=?, notes=? WHERE id=?',
      [patient_id, referring_doctor_id, receiving_doctor_id || null, department_id || null, status, priority, reason, notes || null, req.params.id]
    );
    const [rows] = await pool.query(`${referralSelect} WHERE r.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Referral not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update referral' });
  }
});

// DELETE /api/referrals/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM referrals WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Referral not found' });
    res.json({ message: 'Referral deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete referral' });
  }
});

module.exports = router;
