/**
 * Device Questionnaire Engine routes.
 *
 * This module implements a **rule-based expert system** for device classification.
 * It uses the shared `classify()` function from engine/classifier.js which applies
 * branching logic (disqualifier checks) and weighted scoring to determine whether
 * a device should be classified as reuse / resell / refurbish / recycle.
 *
 * This is NOT a machine-learning model — it is a structured knowledge-based system
 * with questions, weights, and disqualifier flags stored in the database and
 * editable by admins.
 */
const router = require('express').Router();
const db = require('../db/pool');
const { authenticate } = require('../middleware/auth');
const { classify } = require('../engine/classifier');

// ── POST /api/questionnaire/:deviceId — submit device-level responses ──
router.post('/:deviceId', authenticate, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { responses } = req.body; // [{ question_id, answer }]

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ error: 'responses array is required' });
    }

    // Verify device exists and belongs to user
    const deviceRes = await db.query('SELECT * FROM devices WHERE id = $1', [deviceId]);
    if (!deviceRes.rows.length) return res.status(404).json({ error: 'Device not found' });
    const device = deviceRes.rows[0];

    // Load questions for this category
    const questionsRes = await db.query(
      'SELECT * FROM questions WHERE category_id = $1 ORDER BY display_order',
      [device.category_id],
    );
    const questions = questionsRes.rows;

    // ── Run the shared classification engine (rule-based expert system) ──
    const classification = classify(questions, responses, 'device');

    // ── Persist responses ───────────────────────────────────────
    // Clear old responses first (allow re-assessment)
    await db.query('DELETE FROM responses WHERE device_id = $1', [deviceId]);
    for (const r of responses) {
      await db.query(
        'INSERT INTO responses (device_id, question_id, answer) VALUES ($1,$2,$3)',
        [deviceId, r.question_id, r.answer],
      );
    }

    // ── Persist classification ──────────────────────────────────
    await db.query('DELETE FROM classifications WHERE device_id = $1', [deviceId]);
    await db.query(
      `INSERT INTO classifications (device_id, result, reasoning, score)
       VALUES ($1,$2,$3,$4)`,
      [deviceId, classification.result, classification.reasoning, classification.score],
    );

    res.json({
      device_id: parseInt(deviceId),
      result: classification.result,
      score: classification.score,
      maxScore: classification.maxScore,
      reasoning: classification.reasoning,
    });
  } catch (err) {
    console.error('Questionnaire error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/questionnaire/:deviceId — get existing classification ──
router.get('/:deviceId', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM classifications WHERE device_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.params.deviceId],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'No classification found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get classification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
