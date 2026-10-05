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
    answerMap[r.question_id] = r.answer.toLowerCase();
  });

  // ── Step 1: Check disqualifiers ──────────────────────────────
  const disqualifiers = questions.filter((q) => q.is_disqualifier);
  for (const dq of disqualifiers) {
    const ans = answerMap[dq.id];
    // For disqualifier questions the "bad" answer triggers disqualification.
    // Convention: disqualifier question phrased as a negative condition
    // (e.g. "Any swelling or leakage?")  →  "yes" = bad  →  disqualify.
    if (ans === 'yes') {
      const result = mode === 'component' ? 'recycle' : 'recycle';
      const qObj = questions.find((q) => q.id === dq.id);
      return {
        result,
        score: 0,
        maxScore: 0,
        reasoning: `Disqualified: "${qObj?.text || 'Unknown question'}" answered Yes. Immediate ${result} recommendation.`,
      };
    }
  }

  // ── Step 2: Weighted scoring ─────────────────────────────────
  // Non-disqualifier questions: "yes" = good condition → earn the weight
  const scorable = questions.filter((q) => !q.is_disqualifier);
  let maxScore = 0;
  let earnedScore = 0;
  const details = [];

  for (const q of scorable) {
    maxScore += q.weight;
    const ans = answerMap[q.id];
    if (ans === 'yes') {
      earnedScore += q.weight;
      details.push(`✓ "${q.text}" (+${q.weight})`);
    } else {
      details.push(`✗ "${q.text}" (+0)`);
    }
  }

  const pct = maxScore > 0 ? (earnedScore / maxScore) * 100 : 0;

  // ── Step 3: Threshold mapping ────────────────────────────────
  let result;
  if (mode === 'component') {
    result = pct >= 50 ? 'reusable' : 'recycle';
  } else {
    if (pct >= 80) result = 'reuse';
    else if (pct >= 60) result = 'resell';
    else if (pct >= 40) result = 'refurbish';
    else result = 'recycle';
  }

  const reasoning = [
    `Score: ${earnedScore}/${maxScore} (${pct.toFixed(1)}%)`,
    `Classification: ${result.toUpperCase()}`,
    '',
    'Breakdown:',
    ...details,
  ].join('\n');

  return { result, score: earnedScore, maxScore, reasoning };
}

module.exports = { classify };
