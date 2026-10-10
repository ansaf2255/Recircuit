/**
 * Component Assessment Engine routes.
 *
 * This module implements a **rule-based expert system** for per-component
 * assessment, reusing the same shared `classify()` function as the device-level
 * engine. Each component (Battery, RAM, Display, etc.) is assessed independently
 * through its own set of weighted questions with disqualifier support.
 *
 * Output per component: reusable | recycle, with plain-language reasoning.
 *
 * This is a knowledge-based system, NOT a machine learning model.
 */
const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { classify } = require('../engine/classifier');

// ── GET /api/components/:componentId/questions ───────────────
router.get('/:componentId/questions', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM component_questions WHERE component_id = $1 ORDER BY display_order',
      [req.params.componentId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Component questions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/components/:deviceId/assess — submit ALL component responses ──
router.post('/:deviceId/assess', authenticate, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { deviceId } = req.params;
    const { componentResponses } = req.body;

    if (!componentResponses || !Array.isArray(componentResponses)) {
      client.release();
      return res.status(400).json({ error: 'componentResponses array is required' });
    }

    await client.query('BEGIN');

    // Verify device exists
    const deviceRes = await client.query('SELECT * FROM devices WHERE id = $1', [deviceId]);
    if (!deviceRes.rows.length) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Device not found' });
    }
    const device = deviceRes.rows[0];
    if (device.user_id !== req.user.id) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(403).json({ error: 'Not authorized to assess this device' });
    }

    // Clear previous component data for this device (allow re-assessment)
    await client.query('DELETE FROM component_responses WHERE device_id = $1', [deviceId]);
    await client.query('DELETE FROM component_classifications WHERE device_id = $1', [deviceId]);

    const results = [];

    for (const comp of componentResponses) {
      const { component_id, responses } = comp;

      // Load component questions
      const questionsRes = await client.query(
        'SELECT * FROM component_questions WHERE component_id = $1 ORDER BY display_order',
        [component_id],
      );
      const questions = questionsRes.rows;

      // ── Run the shared classification engine in component mode ──
      const classification = classify(questions, responses, 'component');

      // Persist responses
      for (const r of responses) {
        await client.query(
          `INSERT INTO component_responses (device_id, component_id, question_id, answer)
           VALUES ($1,$2,$3,$4)`,
          [deviceId, component_id, r.question_id, r.answer],
        );
      }

      const recommended_action = classification.result === 'reusable' ? 'reuse_part' : 'recycle_material';

      // Persist classification
      await client.query(
        `INSERT INTO component_classifications (device_id, component_id, result, recommended_action, reasoning)
         VALUES ($1,$2,$3,$4,$5)`,
        [deviceId, component_id, classification.result, recommended_action, classification.reasoning],
      );

      // Get component name for the response
      const compInfo = await client.query('SELECT name FROM components WHERE id = $1', [component_id]);

      results.push({
        component_id,
        component_name: compInfo.rows[0]?.name || 'Unknown',
        result: classification.result,
        recommended_action,
        score: classification.score,
        maxScore: classification.maxScore,
        reasoning: classification.reasoning,
      });
    }

    await client.query('COMMIT');
    client.release();
    res.json({ device_id: parseInt(deviceId), components: results });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Component assessment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/components/:deviceId/results — get component breakdown ──
router.get('/:deviceId/results', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT cc.*, c.name AS component_name
       FROM component_classifications cc
       JOIN components c ON c.id = cc.component_id
       WHERE cc.device_id = $1
       ORDER BY c.name`,
      [req.params.deviceId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Component results error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/components/available — browse salvageable reusable components ──
router.get('/available', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'recycler') {
      return res.json([]);
    }

    const { category_id, search, location, lat, lng, radius_km, component_name } = req.query;

    const params = [req.user.id];
    let distanceSelect = 'NULL AS distance_km';
    const conditions = ["cc.result = 'reusable'", "COALESCE(cc.status, 'available') = 'available'", 'd.user_id != $1'];

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

    if (component_name && component_name.trim()) {
      params.push(`%${component_name.trim().toLowerCase()}%`);
      conditions.push(`LOWER(comp.name) LIKE $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const searchParam = `$${params.length}`;
      conditions.push(`(
        LOWER(comp.name) LIKE ${searchParam} OR 
        LOWER(d.brand) LIKE ${searchParam} OR 
        LOWER(d.model) LIKE ${searchParam} OR 
        LOWER(COALESCE(d.location, '')) LIKE ${searchParam}
      )`);
    }

    if (location && location.trim()) {
      params.push(`%${location.trim().toLowerCase()}%`);
      conditions.push(`LOWER(COALESCE(d.location, '')) LIKE $${params.length}`);
    }

    let sql = `
      SELECT cc.id, cc.device_id, cc.component_id, cc.result, cc.recommended_action, cc.reasoning,
             COALESCE(cc.status, 'available') AS status, cc.price, cc.created_at,
             comp.name AS component_name,
             d.brand, d.model, d.location AS device_location, d.latitude, d.longitude, d.images,
             c.id AS category_id, c.name AS category_name,
             u.id AS seller_id, u.name AS seller_name, u.email AS seller_email,
             ${distanceSelect}
      FROM component_classifications cc
      JOIN components comp ON comp.id = cc.component_id
      JOIN devices d ON d.id = cc.device_id
      JOIN categories c ON c.id = d.category_id
      JOIN users u ON u.id = d.user_id
      WHERE ${conditions.join(' AND ')}
    `;

    if (userLat !== null && userLng !== null && radius_km && !isNaN(parseFloat(radius_km))) {
      sql = `SELECT * FROM (${sql}) sub WHERE sub.distance_km IS NULL OR sub.distance_km <= ${parseFloat(radius_km)} ORDER BY sub.distance_km ASC NULLS LAST, sub.created_at DESC`;
    } else if (userLat !== null && userLng !== null) {
      sql = `SELECT * FROM (${sql}) sub ORDER BY sub.distance_km ASC NULLS LAST, sub.created_at DESC`;
    } else {
      sql += ' ORDER BY cc.created_at DESC NULLS LAST';
    }

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List available components error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/components/:id/claim — claim/buy a salvage component ──
router.post('/:id/claim', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'recycler') {
      return res.status(403).json({ error: 'Recyclers process complete end-of-life devices for material recovery, not individual reusable parts' });
    }

    const { id } = req.params;

    const checkRes = await db.query(
      `SELECT cc.*, d.user_id AS seller_id, comp.name AS component_name, d.brand, d.model
       FROM component_classifications cc
       JOIN devices d ON d.id = cc.device_id
       JOIN components comp ON comp.id = cc.component_id
       WHERE cc.id = $1`,
      [id]
    );

    if (!checkRes.rows.length) return res.status(404).json({ error: 'Component listing not found' });
    const item = checkRes.rows[0];

    if (item.seller_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot claim your own component' });
    }

    if (item.status === 'claimed' || item.status === 'sold') {
      return res.status(409).json({ error: 'This component has already been claimed' });
    }

    const updated = await db.query(
      `UPDATE component_classifications 
       SET status = 'claimed', buyer_id = $1 
       WHERE id = $2 RETURNING *`,
      [req.user.id, id]
    );

    res.json({
      message: `Successfully requested ${item.component_name} from ${item.brand} ${item.model}`,
      component: updated.rows[0],
    });
  } catch (err) {
    console.error('Claim component error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/components/my-orders — components claimed/purchased by current user ──
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'recycler') {
      return res.json([]);
    }

    const result = await db.query(
      `SELECT cc.id, cc.device_id, cc.component_id, cc.result, cc.status, cc.price, cc.created_at,
              comp.name AS component_name,
              d.brand, d.model, d.location AS device_location, d.images,
              c.name AS category_name,
              seller.name AS seller_name, seller.email AS seller_email
       FROM component_classifications cc
       JOIN components comp ON comp.id = cc.component_id
       JOIN devices d ON d.id = cc.device_id
       JOIN categories c ON c.id = d.category_id
       JOIN users seller ON seller.id = d.user_id
       WHERE cc.buyer_id = $1
       ORDER BY cc.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('My component orders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /api/components/:id/listing — update price or status by device owner ──
router.patch('/:id/listing', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { price, status } = req.body;

    const check = await db.query(
      `SELECT cc.id FROM component_classifications cc
       JOIN devices d ON d.id = cc.device_id
       WHERE cc.id = $1 AND d.user_id = $2`,
      [id, req.user.id]
    );

    if (!check.rows.length) {
      return res.status(403).json({ error: 'Not authorized to manage this component' });
    }

    const updated = await db.query(
      `UPDATE component_classifications SET 
        price = COALESCE($1, price),
        status = COALESCE($2, status)
       WHERE id = $3 RETURNING *`,
      [price !== undefined ? price : null, status || null, id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error('Update component listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/components/incoming-orders — components claimed by others from seller's devices ──
router.get('/incoming-orders', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT cc.id, cc.device_id, cc.component_id, cc.result, cc.status, cc.price, cc.created_at,
              comp.name AS component_name,
              d.brand, d.model, d.location AS device_location, d.images,
              c.name AS category_name,
              buyer.name AS buyer_name, buyer.email AS buyer_email
       FROM component_classifications cc
       JOIN components comp ON comp.id = cc.component_id
       JOIN devices d ON d.id = cc.device_id
       JOIN categories c ON c.id = d.category_id
       JOIN users buyer ON buyer.id = cc.buyer_id
       WHERE d.user_id = $1 AND cc.buyer_id IS NOT NULL
       ORDER BY cc.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Incoming component orders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── PATCH /api/components/:id/order-status — update component order status by seller or buyer ──
router.patch('/:id/order-status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['available', 'claimed', 'dispatched', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const check = await db.query(
      `SELECT cc.*, d.user_id AS seller_id
       FROM component_classifications cc
       JOIN devices d ON d.id = cc.device_id
       WHERE cc.id = $1`,
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ error: 'Component order not found' });
    }

    const item = check.rows[0];
    if (item.seller_id !== req.user.id && item.buyer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this component order' });
    }

    let updateSql = `UPDATE component_classifications SET status = $1 WHERE id = $2 RETURNING *`;
    let params = [status, id];
    if (status === 'available' || status === 'cancelled') {
      updateSql = `UPDATE component_classifications SET status = $1, buyer_id = NULL WHERE id = $2 RETURNING *`;
    }

    const updated = await db.query(updateSql, params);
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('Update component order status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
