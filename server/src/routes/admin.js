/**
 * Admin routes — category/question management, user verification, analytics.
 */
const router = require('express').Router();
const db = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// ═══════════════════════════════════════════════════════════════
//  CATEGORY MANAGEMENT
// ═══════════════════════════════════════════════════════════════

router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await db.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Category already exists' });
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await db.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, req.params.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  DEVICE QUESTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════

router.post('/questions', async (req, res) => {
  try {
    const { category_id, text, answer_type, weight, is_disqualifier, display_order } = req.body;
    if (!category_id || !text) return res.status(400).json({ error: 'category_id and text are required' });
    const result = await db.query(
      `INSERT INTO questions (category_id, text, answer_type, weight, is_disqualifier, display_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [category_id, text, answer_type || 'yes_no', weight || 0, is_disqualifier || false, display_order || 0],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/questions/:id', async (req, res) => {
  try {
    const { text, answer_type, weight, is_disqualifier, display_order } = req.body;
    const result = await db.query(
      `UPDATE questions SET text=$1, answer_type=$2, weight=$3, is_disqualifier=$4, display_order=$5
       WHERE id=$6 RETURNING *`,
      [text, answer_type, weight, is_disqualifier, display_order, req.params.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Question not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM questions WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (err) {
    console.error('Delete question error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  COMPONENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

router.post('/components', async (req, res) => {
  try {
    const { category_id, name } = req.body;
    if (!category_id || !name) return res.status(400).json({ error: 'category_id and name are required' });
    const result = await db.query(
      'INSERT INTO components (category_id, name) VALUES ($1,$2) RETURNING *',
      [category_id, name],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create component error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/components/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM components WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Component not found' });
    res.json({ message: 'Component deleted' });
  } catch (err) {
    console.error('Delete component error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  COMPONENT QUESTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════

router.post('/component-questions', async (req, res) => {
  try {
    const { component_id, text, weight, is_disqualifier, display_order } = req.body;
    if (!component_id || !text) return res.status(400).json({ error: 'component_id and text are required' });
    const result = await db.query(
      `INSERT INTO component_questions (component_id, text, weight, is_disqualifier, display_order)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [component_id, text, weight || 0, is_disqualifier || false, display_order || 0],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create component question error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/component-questions/:id', async (req, res) => {
  try {
    const { text, weight, is_disqualifier, display_order } = req.body;
    const result = await db.query(
      `UPDATE component_questions SET text=$1, weight=$2, is_disqualifier=$3, display_order=$4
       WHERE id=$5 RETURNING *`,
      [text, weight, is_disqualifier, display_order, req.params.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Question not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update component question error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/component-questions/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM component_questions WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Component question deleted' });
  } catch (err) {
    console.error('Delete component question error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  USER VERIFICATION
// ═══════════════════════════════════════════════════════════════

router.get('/users', async (req, res) => {
  try {
    const { role, verified } = req.query;
    let sql = 'SELECT id, name, email, role, location, verified, created_at FROM users WHERE 1=1';
    const params = [];
    if (role) { params.push(role); sql += ` AND role = $${params.length}`; }
    if (verified !== undefined) { params.push(verified === 'true'); sql += ` AND verified = $${params.length}`; }
    sql += ' ORDER BY created_at DESC';
    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/users/:id/verify', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE users SET verified = true WHERE id = $1 RETURNING id, name, email, role, verified',
      [req.params.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Verify user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  ANALYTICS
// ═══════════════════════════════════════════════════════════════

router.get('/analytics', async (_req, res) => {
  try {
    // Devices by category
    const byCategory = await db.query(`
      SELECT c.name AS category, COUNT(d.id) AS count
      FROM categories c
      LEFT JOIN devices d ON d.category_id = c.id
      GROUP BY c.name ORDER BY count DESC
    `);

    // Devices by classification outcome
    const byOutcome = await db.query(`
      SELECT cl.result, COUNT(*) AS count
      FROM classifications cl
      GROUP BY cl.result ORDER BY count DESC
    `);

    // Component-level reuse/recycle stats
    const componentStats = await db.query(`
      SELECT comp.name AS component, cc.result, COUNT(*) AS count
      FROM component_classifications cc
      JOIN components comp ON comp.id = cc.component_id
      GROUP BY comp.name, cc.result
      ORDER BY comp.name, cc.result
    `);

    // Total devices
    const totalDevices = await db.query('SELECT COUNT(*) AS count FROM devices');

    // Estimated landfill diversion (devices classified as reuse/resell/refurbish)
    const diverted = await db.query(`
      SELECT COUNT(*) AS count FROM classifications WHERE result != 'recycle'
    `);

    // Requests by status
    const requestsByStatus = await db.query(`
      SELECT status, COUNT(*) AS count FROM requests GROUP BY status
    `);

    res.json({
      totalDevices: parseInt(totalDevices.rows[0].count),
      divertedFromLandfill: parseInt(diverted.rows[0].count),
      byCategory: byCategory.rows,
      byOutcome: byOutcome.rows,
      componentStats: componentStats.rows,
      requestsByStatus: requestsByStatus.rows,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
