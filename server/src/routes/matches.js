/**
 * Matching Engine routes.
 *
 * Routes devices to the appropriate recycler or refurbisher based on:
 *   1. Device classification result
 *      - recycle → matched to users with role = 'recycler'
 *      - reuse / resell / refurbish → matched to users with role = 'refurbisher'
 *   2. Location proximity (basic string matching for MVP; extendable to
 *      geo-distance later)
 */
const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// ── POST /api/matches/:deviceId — auto-match device to recycler/refurbisher ──
router.post('/:deviceId', authenticate, async (req, res) => {
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

    if (!device.classification) {
      return res.status(400).json({ error: 'Device must be classified before matching' });
    }

    // Determine target role based on classification
    const targetRole = device.classification === 'recycle' ? 'recycler' : 'refurbisher';

    // Find verified users with the target role, prefer same location
    const candidatesRes = await db.query(
      `SELECT id, name, email, location,
              CASE WHEN LOWER(location) = LOWER($1) THEN 0 ELSE 1 END AS distance_rank
       FROM users
       WHERE role = $2 AND verified = true
       ORDER BY distance_rank, created_at`,
      [device.location || '', targetRole],
    );

    if (!candidatesRes.rows.length) {
      return res.status(404).json({ error: `No verified ${targetRole}s found` });
    }

    const bestMatch = candidatesRes.rows[0];

    // Check for existing match
    const existingMatch = await db.query(
      'SELECT id FROM matches WHERE device_id = $1 AND recycler_id = $2',
      [deviceId, bestMatch.id],
    );

    let match;
    if (existingMatch.rows.length) {
      match = existingMatch.rows[0];
    } else {
      const matchRes = await db.query(
        'INSERT INTO matches (device_id, recycler_id) VALUES ($1,$2) RETURNING *',
        [deviceId, bestMatch.id],
      );
      match = matchRes.rows[0];

      // Auto-create a pending request
      await db.query(
        'INSERT INTO requests (match_id, status) VALUES ($1, $2)',
        [match.id, 'pending'],
      );
    }

    res.json({
      match,
      matched_to: {
        id: bestMatch.id,
        name: bestMatch.name,
        location: bestMatch.location,
        role: targetRole,
      },
      all_candidates: candidatesRes.rows,
    });
  } catch (err) {
    console.error('Match error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/matches — list matches for current user ─────────
router.get('/', authenticate, async (req, res) => {
  try {
    let sql, params;
    if (req.user.role === 'seller') {
      sql = `
        SELECT m.*, d.brand, d.model, d.image_url, c.name AS category_name,
               u.name AS recycler_name, u.location AS recycler_location,
               r.status AS request_status, r.id AS request_id,
               cl.result AS classification
        FROM matches m
        JOIN devices d ON d.id = m.device_id
        JOIN categories c ON c.id = d.category_id
        JOIN users u ON u.id = m.recycler_id
        LEFT JOIN requests r ON r.match_id = m.id
        LEFT JOIN classifications cl ON cl.device_id = d.id
        WHERE d.user_id = $1
        ORDER BY m.created_at DESC
      `;
      params = [req.user.id];
    } else {
      sql = `
        SELECT m.*, d.brand, d.model, d.image_url, c.name AS category_name,
               u.name AS seller_name, d.location AS device_location,
               r.status AS request_status, r.id AS request_id,
               cl.result AS classification
        FROM matches m
        JOIN devices d ON d.id = m.device_id
        JOIN categories c ON c.id = d.category_id
        JOIN users u ON u.id = d.user_id
        LEFT JOIN requests r ON r.match_id = m.id
        LEFT JOIN classifications cl ON cl.device_id = d.id
        WHERE m.recycler_id = $1
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
