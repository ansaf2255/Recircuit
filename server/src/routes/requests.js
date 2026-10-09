/**
 * Request tracking routes.
 * Lifecycle: pending → accepted|cancelled, accepted → completed|cancelled
 */
const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// ── GET /api/requests — list requests for current user ───────
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

    if (req.user.role === 'admin') {
      sql = `
        SELECT r.*, m.device_id, m.partner_id,
               d.brand, d.model, c.name AS category_name, d.description, d.image_url, d.location AS device_location,
               seller.name AS seller_name, seller.email AS seller_email,
               partner.name AS partner_name, partner.email AS partner_email,
               cl.result AS classification,
               ${compsAgg}
        FROM requests r
        JOIN matches m ON m.id = r.match_id
        JOIN devices d ON d.id = m.device_id
        JOIN categories c ON c.id = d.category_id
        JOIN users seller ON seller.id = d.user_id
        JOIN users partner ON partner.id = m.partner_id
        LEFT JOIN classifications cl ON cl.device_id = d.id
        ORDER BY r.updated_at DESC
      `;
      params = [];
    } else if (req.user.role === 'seller') {
      sql = `
        SELECT r.*, m.device_id, m.partner_id,
               d.brand, d.model, c.name AS category_name, d.description, d.image_url, d.location AS device_location,
               partner.name AS partner_name,
               CASE WHEN r.status IN ('accepted', 'completed') THEN partner.email ELSE NULL END AS partner_email,
               cl.result AS classification,
               ${compsAgg}
        FROM requests r
        JOIN matches m ON m.id = r.match_id
        JOIN devices d ON d.id = m.device_id
        JOIN categories c ON c.id = d.category_id
        JOIN users partner ON partner.id = m.partner_id
        LEFT JOIN classifications cl ON cl.device_id = d.id
        WHERE d.user_id = $1
        ORDER BY r.updated_at DESC
      `;
      params = [req.user.id];
    } else {
      sql = `
        SELECT r.*, m.device_id, m.partner_id,
               d.brand, d.model, c.name AS category_name, d.description, d.image_url, d.location AS device_location,
               seller.name AS seller_name,
               CASE WHEN r.status IN ('accepted', 'completed') THEN seller.email ELSE NULL END AS seller_email,
               cl.result AS classification,
               ${compsAgg}
        FROM requests r
        JOIN matches m ON m.id = r.match_id
        JOIN devices d ON d.id = m.device_id
        JOIN categories c ON c.id = d.category_id
        JOIN users seller ON seller.id = d.user_id
        LEFT JOIN classifications cl ON cl.device_id = d.id
        WHERE m.partner_id = $1
        ORDER BY r.updated_at DESC
      `;
      params = [req.user.id];
    }

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List requests error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /api/requests/:id — update request status ──────────
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Get current request
    const reqRes = await db.query(
      `SELECT r.*, m.partner_id, d.user_id AS seller_id
       FROM requests r 
       JOIN matches m ON m.id = r.match_id 
       JOIN devices d ON d.id = m.device_id 
       WHERE r.id = $1`,
      [id]
    );
    if (!reqRes.rows.length) return res.status(404).json({ error: 'Request not found' });
    const currentReq = reqRes.rows[0];

    // Ownership: partner, seller, or admin can update status
    if (req.user.role !== 'admin' && req.user.id !== currentReq.partner_id && req.user.id !== currentReq.seller_id) {
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }

    // State machine validation: pending -> accepted|cancelled, accepted -> completed|cancelled
    const currentState = currentReq.status;
    const validTransitions = {
      'pending': ['accepted', 'cancelled'],
      'accepted': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[currentState].includes(status)) {
      return res.status(400).json({ error: `Cannot transition status from '${currentState}' to '${status}'` });
    }

    const result = await db.query(
      `UPDATE requests SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
