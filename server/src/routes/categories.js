/**
 * Category & device-level question routes.
 */
const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// ── GET /api/categories ──────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('List categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/categories/:id/questions ────────────────────────
router.get('/:id/questions', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM questions WHERE category_id = $1 ORDER BY is_disqualifier DESC, display_order',
      [req.params.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List questions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/categories/:id/components ───────────────────────
router.get('/:id/components', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM components WHERE category_id = $1 ORDER BY id',
      [req.params.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List components error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
