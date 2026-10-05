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
  try {
    const { deviceId } = req.params;
    const { componentResponses } = req.body;
    // componentResponses: [{ component_id, responses: [{ question_id, answer }] }]

    if (!componentResponses || !Array.isArray(componentResponses)) {
      return res.status(400).json({ error: 'componentResponses array is required' });
    }

    // Verify device exists
    const deviceRes = await db.query('SELECT * FROM devices WHERE id = $1', [deviceId]);
    if (!deviceRes.rows.length) return res.status(404).json({ error: 'Device not found' });

    // Clear previous component data for this device (allow re-assessment)
    await db.query('DELETE FROM component_responses WHERE device_id = $1', [deviceId]);
    await db.query('DELETE FROM component_classifications WHERE device_id = $1', [deviceId]);

    const results = [];

    for (const comp of componentResponses) {
      const { component_id, responses } = comp;

      // Load component questions
      const questionsRes = await db.query(
        'SELECT * FROM component_questions WHERE component_id = $1 ORDER BY display_order',
        [component_id],
      );
      const questions = questionsRes.rows;

      // ── Run the shared classification engine in component mode ──
      const classification = classify(questions, responses, 'component');

      // Persist responses
      for (const r of responses) {
        await db.query(
          `INSERT INTO component_responses (device_id, component_id, question_id, answer)
           VALUES ($1,$2,$3,$4)`,
          [deviceId, component_id, r.question_id, r.answer],
        );
      }

      // Persist classification
      await db.query(
        `INSERT INTO component_classifications (device_id, component_id, result, reasoning)
         VALUES ($1,$2,$3,$4)`,
        [deviceId, component_id, classification.result, classification.reasoning],
      );

      // Get component name for the response
      const compInfo = await db.query('SELECT name FROM components WHERE id = $1', [component_id]);

      results.push({
        component_id,
        component_name: compInfo.rows[0]?.name || 'Unknown',
        result: classification.result,
        score: classification.score,
        maxScore: classification.maxScore,
        reasoning: classification.reasoning,
      });
    }

    res.json({ device_id: parseInt(deviceId), components: results });
  } catch (err) {
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

module.exports = router;
