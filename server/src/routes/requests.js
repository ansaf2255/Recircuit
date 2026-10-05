/**
 * Request tracking routes.
 * Lifecycle: pending → accepted → completed | cancelled
 */
const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// ── GET /api/requests — list requests for current user ───────
router.get('/', authenticate, async (req, res) => {
  try {
    let sql, params;

    if (req.user.role === 'admin') {
      // Admin sees all requests
      sql = `
        SELECT r.*, m.device_id, m.recycler_id,
               d.brand, d.model, c.name AS category_name,
               seller.name AS seller_name, recycler.name AS recycler_name,
               cl.result AS classification
        FROM requests r
        JOIN matches m ON m.id = r.match_id
        JOIN devices d ON d.id = m.device_id
        JOIN categories c ON c.id = d.category_id
        JOIN users seller ON seller.id = d.user_id
        JOIN users recycler ON recycler.id = m.recycler_id
        LEFT JOIN classifications cl ON cl.device_id = d.id
        ORDER BY r.updated_at DESC
      `;
      params = [];
    } else if (req.user.role === 'seller') {
      sql = `
        SELECT r.*, m.device_id, m.recycler_id,
               d.brand, d.model, c.name AS category_name,
               recycler.name AS recycler_name,
               cl.result AS classification
        FROM requests r
        JOIN matches m ON m.id = r.match_id
        JOIN devices d ON d.id = m.device_id
        JOIN categories c ON c.id = d.category_id
        JOIN users recycler ON recycler.id = m.recycler_id
        LEFT JOIN classifications cl ON cl.device_id = d.id
        WHERE d.user_id = $1
        ORDER BY r.updated_at DESC
      `;
      params = [req.user.id];
    } else {
      sql = `
        SELECT r.*, m.device_id, m.recycler_id,
               d.brand, d.model, c.name AS category_name,
               seller.name AS seller_name,
               cl.result AS classification
        FROM requests r
        JOIN matches m ON m.id = r.match_id
        JOIN devices d ON d.id = m.device_id
        JOIN categories c ON c.id = d.category_id
        JOIN users seller ON seller.id = d.user_id
        LEFT JOIN classifications cl ON cl.device_id = d.id
        WHERE m.recycler_id = $1
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
    const validStatuses = ['pending', 'accepted', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await db.query(
      `UPDATE requests SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, req.params.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Request not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
