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
  const client = await db.pool.connect();
  try {
    const { deviceId } = req.params;
    const { responses } = req.body; // [{ question_id, answer }]

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      client.release();
      return res.status(400).json({ error: 'responses array is required' });
    }

    await client.query('BEGIN');

    // Verify device exists and belongs to user
    const deviceRes = await client.query(
      `SELECT d.*, c.name AS category_name 
       FROM devices d 
       JOIN categories c ON c.id = d.category_id 
       WHERE d.id = $1`, 
      [deviceId]
    );
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

    // Load questions for this category
    const questionsRes = await client.query(
      'SELECT * FROM questions WHERE category_id = $1 ORDER BY display_order ASC',
      [device.category_id],
    );
    const questions = questionsRes.rows;

    // ── Run the shared classification engine (rule-based expert system) ──
    const classification = classify(questions, responses, 'device');

    const finalResult = classification.result;
    const finalReasoning = classification.reasoning;

    // ── Persist responses ───────────────────────────────────────
    await client.query('DELETE FROM responses WHERE device_id = $1', [deviceId]);
    for (const r of responses) {
      await client.query(
        'INSERT INTO responses (device_id, question_id, answer) VALUES ($1,$2,$3)',
        [deviceId, r.question_id, r.answer],
      );
    }

    // ── Persist classification ──────────────────────────────────
    await client.query('DELETE FROM classifications WHERE device_id = $1', [deviceId]);
    await client.query(
      `INSERT INTO classifications (device_id, result, reasoning, score, ai_inspection)
       VALUES ($1,$2,$3,$4,$5)`,
      [deviceId, finalResult, finalReasoning, classification.score, null],
    );

    await client.query('COMMIT');
    client.release();

    res.json({
      device_id: parseInt(deviceId),
      result: finalResult,
      score: classification.score,
      maxScore: classification.maxScore,
      reasoning: finalReasoning,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
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

    // Fetch the detailed diagnostic responses
    const responsesRes = await db.query(
      `SELECT r.id, r.question_id, r.answer, q.text, q.good_answer, q.weight, q.is_disqualifier, q.display_order
       FROM responses r
       JOIN questions q ON q.id = r.question_id
       WHERE r.device_id = $1
       ORDER BY q.display_order ASC`,
      [req.params.deviceId]
    );

    // Fetch component assessments if any exist
    const compResultsRes = await db.query(
      `SELECT cc.*, comp.name AS component_name
       FROM component_classifications cc
       JOIN components comp ON comp.id = cc.component_id
       WHERE cc.device_id = $1
       ORDER BY comp.name ASC`,
      [req.params.deviceId]
    );

    res.json({
      ...result.rows[0],
      responses: responsesRes.rows,
      components: compResultsRes.rows,
    });
  } catch (err) {
    console.error('Get classification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
