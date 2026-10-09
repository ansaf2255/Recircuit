/**
 * Matching Engine routes.
 */
const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// ── GET /api/matches/:deviceId/candidates ──
router.get('/:deviceId/candidates', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Get device + classification
    const deviceRes = await db.query(
      `SELECT d.*, cl.result AS classification
       FROM devices d
       LEFT JOIN classifications cl ON cl.device_id = d.id
       WHERE d.id = $1`,
      [deviceId],
    );
    if (!deviceRes.rows.length) return res.status(404).json({ error: 'Device not found' });
    const device = deviceRes.rows[0];

    // Ownership check
    if (device.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to match this device' });
    }

    if (!device.classification) {
      return res.status(400).json({ error: 'Device must be classified before matching' });
    }

    // Require component assessment for recycle
    if (device.classification === 'recycle') {
      const compRes = await db.query('SELECT 1 FROM component_classifications WHERE device_id = $1 LIMIT 1', [deviceId]);
      if (!compRes.rows.length) {
        return res.status(400).json({ error: 'You must complete the component assessment before finding a match for a recycled device.' });
      }
    }

    const targetRole = device.classification === 'recycle' ? 'recycler' : 'refurbisher';

    // Find verified users (hide email)
    const candidatesRes = await db.query(
      `SELECT id, name, location, role,
              CASE WHEN LOWER(location) = LOWER($1) THEN 0 ELSE 1 END AS distance_rank
       FROM users
       WHERE role = $2 AND verified = true
       ORDER BY distance_rank, created_at`,
      [device.location || '', targetRole],
    );

    res.json(candidatesRes.rows);
  } catch (err) {
    console.error('Candidates error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/matches/:deviceId — match device to chosen partner ──
router.post('/:deviceId', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { partner_id } = req.body;
    
    if (!partner_id) return res.status(400).json({ error: 'partner_id is required' });

    // Verify ownership & classification
    const deviceRes = await db.query(
      `SELECT d.*, cl.result AS classification
       FROM devices d
       LEFT JOIN classifications cl ON cl.device_id = d.id
       WHERE d.id = $1`,
      [deviceId]
    );
    if (!deviceRes.rows.length) return res.status(404).json({ error: 'Device not found' });
    const device = deviceRes.rows[0];
    if (device.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    
    if (!device.classification) {
      return res.status(400).json({ error: 'Device must be classified before matching' });
    }
    if (device.classification === 'recycle') {
      const compRes = await db.query('SELECT 1 FROM component_classifications WHERE device_id = $1 LIMIT 1', [deviceId]);
      if (!compRes.rows.length) {
        return res.status(400).json({ error: 'You must complete the component assessment before finding a match for a recycled device.' });
      }
    }

    // Check existing match
    const existingMatch = await db.query(
      'SELECT id FROM matches WHERE device_id = $1 AND partner_id = $2',
      [deviceId, partner_id]
    );
    let match;
    if (existingMatch.rows.length) {
      match = existingMatch.rows[0];
    } else {
      const matchRes = await db.query(
        'INSERT INTO matches (device_id, partner_id) VALUES ($1,$2) RETURNING *',
        [deviceId, partner_id]
      );
      match = matchRes.rows[0];
      await db.query(
        'INSERT INTO requests (match_id, status) VALUES ($1, $2)',
        [match.id, 'pending']
      );
    }

    res.json(match);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Match already exists' });
    console.error('Match creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/matches/claim/:deviceId — partner claims a device ──
router.post('/claim/:deviceId', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const partner_id = req.user.id;

    if (req.user.role === 'seller') {
      return res.status(403).json({ error: 'Sellers cannot claim devices' });
    }

    // Check device classification & existance
    const deviceRes = await db.query(
      `SELECT d.*, cl.result AS classification
       FROM devices d
       LEFT JOIN classifications cl ON cl.device_id = d.id
       WHERE d.id = $1`,
      [deviceId]
    );
    if (!deviceRes.rows.length) return res.status(404).json({ error: 'Device not found' });
    const device = deviceRes.rows[0];

    // Check if match already exists
    const existingMatch = await db.query('SELECT id FROM matches WHERE device_id = $1', [deviceId]);
    if (existingMatch.rows.length) {
      return res.status(409).json({ error: 'Device has already been claimed or matched' });
    }

    const matchRes = await db.query(
      'INSERT INTO matches (device_id, partner_id) VALUES ($1,$2) RETURNING *',
      [deviceId, partner_id]
    );
    const match = matchRes.rows[0];
    await db.query(
      'INSERT INTO requests (match_id, status) VALUES ($1, $2)',
      [match.id, 'pending']
    );

    res.json(match);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Match already exists' });
    console.error('Device claim error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/matches — list matches for current user ─────────
router.get('/', authenticate, async (req, res) => {
  try {
    let sql, params;
    const compsAgg = `
      (SELECT json_agg(json_build_object(
        'component_name', comp.name,
        'result', cc.result,
        'recommended_action', cc.recommended_action
      ))
      FROM component_classifications cc
      JOIN components comp ON comp.id = cc.component_id
      WHERE cc.device_id = d.id) AS components
    `;

    if (req.user.role === 'seller') {
      sql = `
        SELECT m.*, d.brand, d.model, d.image_url, c.name AS category_name,
               u.name AS partner_name, u.location AS partner_location,
               r.status AS request_status, r.id AS request_id,
               cl.result AS classification,
               ${compsAgg}
        FROM matches m
        JOIN devices d ON d.id = m.device_id
        JOIN categories c ON c.id = d.category_id
        JOIN users u ON u.id = m.partner_id
        LEFT JOIN requests r ON r.match_id = m.id
        LEFT JOIN classifications cl ON cl.device_id = d.id
        WHERE d.user_id = $1
        ORDER BY m.created_at DESC
      `;
      params = [req.user.id];
    } else {
      sql = `
        SELECT m.*, d.brand, d.model, d.image_url, c.name AS category_name, d.description,
               u.name AS seller_name, d.location AS device_location,
               r.status AS request_status, r.id AS request_id,
               cl.result AS classification,
               ${compsAgg}
        FROM matches m
        JOIN devices d ON d.id = m.device_id
        JOIN categories c ON c.id = d.category_id
        JOIN users u ON u.id = d.user_id
        LEFT JOIN requests r ON r.match_id = m.id
        LEFT JOIN classifications cl ON cl.device_id = d.id
        WHERE m.partner_id = $1
        ORDER BY m.created_at DESC
      `;
      params = [req.user.id];
    }
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List matches error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
