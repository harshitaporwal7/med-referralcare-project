const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const apptSelect = `
SELECT
  a.*,
  DATE_FORMAT(a.appointment_date,'%Y-%m-%d') AS appointment_date,
  p.full_name AS patient_name,
  d.name AS doctor_name,
  d.specialization AS doctor_specialization
FROM appointments a
LEFT JOIN patients p ON a.patient_id = p.id
LEFT JOIN doctors d ON a.doctor_id = d.id
`;

// GET /api/appointments
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) { whereClause += ' AND a.status = ?'; params.push(status); }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM appointments a ${whereClause}`, params);
    const total = countResult[0].total;

    const [rows] = await pool.query(
      `${apptSelect} ${whereClause} ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ appointments: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /api/appointments/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`${apptSelect} WHERE a.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Appointment not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// POST /api/appointments
router.post('/', authenticate, async (req, res) => {
  try {
    const { patient_id, doctor_id, referral_id, appointment_date, appointment_time, duration_minutes = 30, status = 'scheduled', notes } = req.body;
    if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Patient, doctor, date, and time are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO appointments (patient_id, doctor_id, referral_id, appointment_date, appointment_time, duration_minutes, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [patient_id, doctor_id, referral_id || null, appointment_date, appointment_time, duration_minutes, status, notes || null]
    );
    const [rows] = await pool.query(`${apptSelect} WHERE a.id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// PUT /api/appointments/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { patient_id, doctor_id, referral_id, appointment_date, appointment_time, duration_minutes, status, notes } = req.body;
    await pool.query(
      'UPDATE appointments SET patient_id=?, doctor_id=?, referral_id=?, appointment_date=?, appointment_time=?, duration_minutes=?, status=?, notes=? WHERE id=?',
      [patient_id, doctor_id, referral_id || null, appointment_date, appointment_time, duration_minutes || 30, status, notes || null, req.params.id]
    );
    const [rows] = await pool.query(`${apptSelect} WHERE a.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Appointment not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

module.exports = router;
