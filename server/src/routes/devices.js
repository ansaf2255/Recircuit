/**
 * Device routes — CRUD + image upload.
 */
const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ── GET /api/devices — list all (optionally filter by user) ──
router.get('/', authenticate, async (req, res) => {
  try {
    const { user_id, category_id } = req.query;
    let sql = `
      SELECT d.*, c.name AS category_name, u.name AS user_name,
             cl.result AS classification
      FROM devices d
      JOIN categories c ON c.id = d.category_id
      JOIN users u ON u.id = d.user_id
      LEFT JOIN classifications cl ON cl.device_id = d.id
    `;
    const conditions = [];
    const params = [];

    if (user_id) {
      params.push(user_id);
      conditions.push(`d.user_id = $${params.length}`);
    }
    if (category_id) {
      params.push(category_id);
      conditions.push(`d.category_id = $${params.length}`);
    }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY d.created_at DESC';

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List devices error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/devices/:id ─────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.*, c.name AS category_name, u.name AS user_name
       FROM devices d
       JOIN categories c ON c.id = d.category_id
       JOIN users u ON u.id = d.user_id
       WHERE d.id = $1`,
      [req.params.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Device not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get device error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/devices — create device + optional image ───────
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { category_id, brand, model, description, location } = req.body;
    if (!category_id) return res.status(400).json({ error: 'category_id is required' });

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await db.query(
      `INSERT INTO devices (user_id, category_id, brand, model, description, location, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, category_id, brand || null, model || null, description || null, location || null, image_url],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create device error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── DELETE /api/devices/:id ──────────────────────────────────
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM devices WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Device not found or not yours' });
    res.json({ message: 'Device deleted' });
  } catch (err) {
    console.error('Delete device error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
