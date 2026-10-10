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

    if (req.user.role === 'seller') {
      params.push(req.user.id);
      conditions.push(`d.user_id = $${params.length}`);
    } else if (user_id) {
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

// ── GET /api/devices/available — marketplace for partners ────
router.get('/available', authenticate, async (req, res) => {
  try {
    const { category_id, search, location, lat, lng, radius_km, classification } = req.query;
    
    const params = [req.user.id];
    let distanceSelect = 'NULL AS distance_km';
    const conditions = ['m.id IS NULL', 'd.user_id != $1'];

    const userLat = lat && !isNaN(parseFloat(lat)) ? parseFloat(lat) : null;
    const userLng = lng && !isNaN(parseFloat(lng)) ? parseFloat(lng) : null;

    if (userLat !== null && userLng !== null) {
      params.push(userLat, userLng);
      const latParam = `$${params.length - 1}`;
      const lngParam = `$${params.length}`;
      distanceSelect = `
        CASE 
          WHEN d.latitude IS NOT NULL AND d.longitude IS NOT NULL THEN
            ROUND((6371 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians(${latParam})) * cos(radians(d.latitude)) *
                cos(radians(d.longitude) - radians(${lngParam})) +
                sin(radians(${latParam})) * sin(radians(d.latitude))
              ))
            ))::numeric, 1)
          ELSE NULL
        END AS distance_km
      `;
    }

    if (category_id) {
      params.push(category_id);
      conditions.push(`d.category_id = $${params.length}`);
    }

    // ── Role-based marketplace visibility ──────────────────────────
    // Recyclers ONLY see recycle electronics.
    // Consumers (sellers) & refurbishers ONLY see reuse/resell/refurbish (other than recycle).
    // Admin sees everything unless explicitly filtered.
    if (req.user.role === 'recycler') {
      conditions.push("cl.result = 'recycle'");
    } else if (req.user.role === 'seller' || req.user.role === 'refurbisher') {
      conditions.push("cl.result != 'recycle'");
      if (classification && classification !== 'All' && ['reuse', 'resell', 'refurbish'].includes(classification)) {
        params.push(classification);
        conditions.push(`cl.result = $${params.length}`);
      }
    } else if (classification && classification !== 'All') {
      params.push(classification);
      conditions.push(`cl.result = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const searchParam = `$${params.length}`;
      conditions.push(`(
        LOWER(d.brand) LIKE ${searchParam} OR 
        LOWER(d.model) LIKE ${searchParam} OR 
        LOWER(COALESCE(d.description, '')) LIKE ${searchParam} OR
        LOWER(COALESCE(d.location, '')) LIKE ${searchParam}
      )`);
    }

    if (location && location.trim()) {
      params.push(`%${location.trim().toLowerCase()}%`);
      conditions.push(`LOWER(COALESCE(d.location, '')) LIKE $${params.length}`);
    }

    let sql = `
      SELECT d.*, c.name AS category_name, u.name AS user_name,
             cl.result AS classification, cl.score AS classification_score,
             ${distanceSelect}
      FROM devices d
      JOIN categories c ON c.id = d.category_id
      JOIN users u ON u.id = d.user_id
      JOIN classifications cl ON cl.device_id = d.id
      LEFT JOIN matches m ON m.device_id = d.id
      WHERE ${conditions.join(' AND ')}
    `;

    if (userLat !== null && userLng !== null && radius_km && !isNaN(parseFloat(radius_km))) {
      sql = `SELECT * FROM (${sql}) sub WHERE sub.distance_km IS NULL OR sub.distance_km <= ${parseFloat(radius_km)} ORDER BY sub.distance_km ASC NULLS LAST, sub.created_at DESC`;
    } else if (userLat !== null && userLng !== null) {
      sql = `SELECT * FROM (${sql}) sub ORDER BY sub.distance_km ASC NULLS LAST, sub.created_at DESC`;
    } else {
      sql += ' ORDER BY d.created_at DESC';
    }

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List available devices error:', err);
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

// ── POST /api/devices — create device + optional images ───────
router.post('/', authenticate, upload.array('images', 4), async (req, res) => {
  try {
    const { category_id, brand, model, description, location, latitude, longitude } = req.body;
    if (!category_id) return res.status(400).json({ error: 'category_id is required' });

    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const parsedLat = latitude && !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : null;
    const parsedLng = longitude && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : null;

    const result = await db.query(
      `INSERT INTO devices (user_id, category_id, brand, model, description, location, latitude, longitude, images)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.id, category_id, brand || null, model || null, description || null, location || null, parsedLat, parsedLng, JSON.stringify(images)],
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

// ── PATCH /api/devices/:id — edit device details ───────────────
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { brand, model, description, location, latitude, longitude } = req.body;
    
    // Ensure the device belongs to the user
    const check = await db.query('SELECT id FROM devices WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!check.rows.length) return res.status(404).json({ error: 'Device not found or not yours' });

    const parsedLat = latitude && !isNaN(parseFloat(latitude)) ? parseFloat(latitude) : null;
    const parsedLng = longitude && !isNaN(parseFloat(longitude)) ? parseFloat(longitude) : null;

    const result = await db.query(
      `UPDATE devices SET 
        brand = COALESCE($1, brand), 
        model = COALESCE($2, model), 
        description = COALESCE($3, description), 
        location = COALESCE($4, location),
        latitude = COALESCE($5, latitude),
        longitude = COALESCE($6, longitude)
       WHERE id = $7 RETURNING *`,
      [brand, model, description, location, parsedLat, parsedLng, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update device error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
