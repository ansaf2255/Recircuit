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

    const targetRoles = device.classification === 'recycle' ? ['recycler'] : ['refurbisher', 'seller'];

    // Find verified users (hide email), excluding device owner
    const candidatesRes = await db.query(
      `SELECT id, name, location, role,
              CASE 
                WHEN LOWER(COALESCE(location, '')) = LOWER($1) AND $1 != '' THEN 0
                WHEN $1 != '' AND (POSITION(LOWER(COALESCE(location, '')) IN LOWER($1)) > 0 OR POSITION(LOWER($1) IN LOWER(COALESCE(location, ''))) > 0) THEN 1
                ELSE 2 
              END AS distance_rank
       FROM users
       WHERE role = ANY($2) AND verified = true AND id != $3
       ORDER BY distance_rank, created_at`,
      [device.location || '', targetRoles, req.user.id],
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
    let requestId;
    if (existingMatch.rows.length) {
      match = existingMatch.rows[0];
      const r = await db.query('SELECT id FROM requests WHERE match_id = $1 LIMIT 1', [match.id]);
      requestId = r.rows[0]?.id;
    } else {
      const matchRes = await db.query(
        'INSERT INTO matches (device_id, partner_id) VALUES ($1,$2) RETURNING *',
        [deviceId, partner_id]
      );
      match = matchRes.rows[0];
      const reqRes = await db.query(
        'INSERT INTO requests (match_id, status) VALUES ($1, $2) RETURNING id',
        [match.id, 'pending']
      );
      requestId = reqRes.rows[0]?.id;
    }

    res.json({ ...match, request_id: requestId });
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

    // Sellers (Consumers) and Recyclers can claim devices based on marketplace logic.

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

    if (device.user_id === partner_id) {
      return res.status(400).json({ error: 'You cannot claim your own device listing' });
    }

    // Role-based claim eligibility:
    if (req.user.role === 'recycler' && device.classification !== 'recycle') {
      return res.status(403).json({ error: 'Recyclers can only claim electronics marked for recycling' });
    }
    if ((req.user.role === 'seller' || req.user.role === 'refurbisher') && device.classification === 'recycle') {
      return res.status(403).json({ error: 'Consumers and refurbishers can only claim reusable and refurbishable electronics' });
    }

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
    const reqRes = await db.query(
      'INSERT INTO requests (match_id, status) VALUES ($1, $2) RETURNING id',
      [match.id, 'pending']
    );

    res.json({ ...match, request_id: reqRes.rows[0]?.id });
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

      sql = `
        SELECT m.*, d.brand, d.model, d.images, c.name AS category_name, d.description,
               seller.name AS seller_name, d.location AS device_location,
               partner.name AS partner_name, partner.location AS partner_location,
               r.status AS request_status, r.id AS request_id,
               cl.result AS classification,
               ${compsAgg}
        FROM matches m
        JOIN devices d ON d.id = m.device_id
        JOIN categories c ON c.id = d.category_id
        JOIN users partner ON partner.id = m.partner_id
        JOIN users seller ON seller.id = d.user_id
        LEFT JOIN requests r ON r.match_id = m.id
        LEFT JOIN classifications cl ON cl.device_id = d.id
        WHERE d.user_id = $1 OR m.partner_id = $1
        ORDER BY m.created_at DESC
      `;
      params = [req.user.id];
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List matches error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
