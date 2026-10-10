/**
 * Shared Classification / Scoring Engine
 * ────────────────────────────────────────
 * This is a **rule-based / knowledge-based expert system**: branching logic
 * combined with weighted scoring.  It is NOT a machine learning model.
 *
 * The engine is used by BOTH the device-level questionnaire and the
 * component-level assessment, avoiding code duplication.
 *
 * Algorithm:
 *   1. If ANY disqualifier question is answered "yes" → immediate worst outcome
 *      (device → "recycle", component → "recycle").
 *   2. Otherwise, sum the weights of all questions answered "yes" (positive
 *      condition = good) to get the total score.
 *   3. Map the score to an outcome via configurable thresholds.
 *
 * Thresholds (device-level, percentage of max possible score):
 *   >=80 % → reuse    (device works as-is)
 *   >=60 % → resell   (minor cosmetic issues)
 *   >=40 % → refurbish (needs repair but salvageable)
 *   < 40 % → recycle  (not worth repairing)
 *
 * Component-level uses a simpler binary threshold:
 *   >=50 % → reusable
 *   < 50 % → recycle
 */

/**
 * Classify a set of responses against their questions.
 *
 * @param {Array} questions  – [{ id, weight, is_disqualifier }]
 * @param {Array} responses  – [{ question_id, answer }]  answer = "yes" | "no"
 * @param {'device'|'component'} mode
 * @returns {{ result: string, score: number, maxScore: number, reasoning: string }}
 */
function classify(questions, responses, mode = 'device') {
  const answerMap = {};
  responses.forEach((r) => {
    let val = '';
    if (typeof r.answer === 'boolean') {
      val = r.answer ? 'yes' : 'no';
    } else if (typeof r.answer === 'string') {
      val = r.answer.toLowerCase().trim();
    } else {
      val = String(r.answer || '').toLowerCase();
    }
    answerMap[r.question_id] = val;
  });

  let maxScore = 0;
  let earnedScore = 0;
  const details = [];
  let hasDisqualifier = false;
  let disqualifierReason = '';

  // ── Step 1: Weighted scoring for all questions ─────────────────────────────────
  for (const q of questions) {
    // Only non-disqualifier questions contribute to the max/earned score.
    // (Or we can let disqualifiers contribute, but typically they are just rules).
    if (!q.is_disqualifier) {
      maxScore += q.weight;
      const ans = answerMap[q.id];
      const goodAns = (q.good_answer || 'yes').toLowerCase();
      if (ans === goodAns) {
        earnedScore += q.weight;
        details.push(`✓ "${q.text}" (+${q.weight})`);
      } else {
        details.push(`✗ "${q.text}" (+0)`);
      }
    } else {
      // It is a disqualifier question
      const ans = answerMap[q.id];
      const goodAns = (q.good_answer || 'yes').toLowerCase();
      if (ans && ans !== goodAns) {
        hasDisqualifier = true;
        disqualifierReason = `Disqualified: "${q.text}" answered ${ans}.`;
        details.push(`⚠️ "${q.text}" (Failed Disqualifier)`);
      } else if (ans === goodAns) {
        details.push(`✓ "${q.text}" (Passed Disqualifier)`);
      }
    }
  }

  const pct = maxScore > 0 ? (earnedScore / maxScore) * 100 : 0;

  // ── Step 2: Threshold mapping & Disqualifier Application ────────────────────────────────
  let result;
  if (mode === 'component') {
    result = pct >= 50 ? 'reusable' : 'recycle';
    if (hasDisqualifier) result = 'recycle'; // Disqualifier overrides
  } else {
    if (pct >= 80) result = 'reuse';
    else if (pct >= 60) result = 'resell';
    else if (pct >= 40) result = 'refurbish';
    else result = 'recycle';

    if (hasDisqualifier) {
      result = 'recycle'; // Disqualifier immediately sends to recycle
    }
  }

  const reasoning = [
    `Score: ${earnedScore}/${maxScore} (${pct.toFixed(1)}%)`,
    `Classification: ${result.toUpperCase()}`,
    hasDisqualifier ? `\nCritical Issue: ${disqualifierReason}` : '',
    '\nBreakdown:',
    ...details,
  ].filter(Boolean).join('\n');

  return { result, score: earnedScore, maxScore, reasoning };
}

module.exports = { classify };
