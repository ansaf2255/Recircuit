const test = require('node:test');
const assert = require('node:assert');
const { classify } = require('./classifier');

test('classifier engine tests', async (t) => {

  await t.test('disqualifier hit immediately results in recycle for device', () => {
    const questions = [
      { id: 1, text: 'Q1', weight: 10, is_disqualifier: false, good_answer: 'yes' },
      { id: 2, text: 'Disq', weight: 0, is_disqualifier: true, good_answer: 'no' }
    ];
    // DQ hit: answering 'yes' to a disqualifier
    const responses = [
      { question_id: 1, answer: 'yes' },
      { question_id: 2, answer: 'yes' }
    ];
    const res = classify(questions, responses, 'device');
    assert.strictEqual(res.result, 'recycle');
    assert.strictEqual(res.score, 0);
  });

  await t.test('threshold boundary 80% (device: reuse)', () => {
    const questions = [{ id: 1, text: 'Q1', weight: 10, is_disqualifier: false, good_answer: 'yes' }];
    const responses = [{ question_id: 1, answer: 'yes' }];
    const res = classify(questions, responses, 'device');
    assert.strictEqual(res.score, 10);
    assert.strictEqual(res.maxScore, 10);
    assert.strictEqual(res.result, 'reuse'); // 100% >= 80%
  });

  await t.test('threshold boundary 60% (device: resell)', () => {
    const questions = [
      { id: 1, text: 'Q1', weight: 6, is_disqualifier: false, good_answer: 'yes' },
      { id: 2, text: 'Q2', weight: 4, is_disqualifier: false, good_answer: 'yes' }
    ];
    const responses = [
      { question_id: 1, answer: 'yes' },
      { question_id: 2, answer: 'no' }
    ];
    const res = classify(questions, responses, 'device');
    assert.strictEqual(res.score, 6);
    assert.strictEqual(res.maxScore, 10);
    assert.strictEqual(res.result, 'resell'); // 60%
  });

  await t.test('threshold boundary 40% (device: refurbish)', () => {
    const questions = [
      { id: 1, text: 'Q1', weight: 4, is_disqualifier: false, good_answer: 'yes' },
      { id: 2, text: 'Q2', weight: 6, is_disqualifier: false, good_answer: 'yes' }
    ];
    const responses = [
      { question_id: 1, answer: 'yes' },
      { question_id: 2, answer: 'no' }
    ];
    const res = classify(questions, responses, 'device');
    assert.strictEqual(res.score, 4);
    assert.strictEqual(res.maxScore, 10);
    assert.strictEqual(res.result, 'refurbish'); // 40%
  });

  await t.test('threshold boundary <40% (device: recycle)', () => {
    const questions = [
      { id: 1, text: 'Q1', weight: 3, is_disqualifier: false, good_answer: 'yes' },
      { id: 2, text: 'Q2', weight: 7, is_disqualifier: false, good_answer: 'yes' }
    ];
    const responses = [
      { question_id: 1, answer: 'yes' },
      { question_id: 2, answer: 'no' }
    ];
    const res = classify(questions, responses, 'device');
    assert.strictEqual(res.score, 3);
    assert.strictEqual(res.maxScore, 10);
    assert.strictEqual(res.result, 'recycle'); // 30% < 40%
  });

  await t.test('threshold boundary >=50% (component: reusable)', () => {
    const questions = [
      { id: 1, text: 'Q1', weight: 5, is_disqualifier: false, good_answer: 'yes' },
      { id: 2, text: 'Q2', weight: 5, is_disqualifier: false, good_answer: 'yes' }
    ];
    const responses = [
      { question_id: 1, answer: 'yes' },
      { question_id: 2, answer: 'no' }
    ];
    const res = classify(questions, responses, 'component');
    assert.strictEqual(res.score, 5);
    assert.strictEqual(res.maxScore, 10);
    assert.strictEqual(res.result, 'reusable'); // 50%
  });

  await t.test('threshold boundary <50% (component: recycle)', () => {
    const questions = [
      { id: 1, text: 'Q1', weight: 4, is_disqualifier: false, good_answer: 'yes' },
      { id: 2, text: 'Q2', weight: 6, is_disqualifier: false, good_answer: 'yes' }
    ];
    const responses = [
      { question_id: 1, answer: 'yes' },
      { question_id: 2, answer: 'no' }
    ];
    const res = classify(questions, responses, 'component');
    assert.strictEqual(res.score, 4);
    assert.strictEqual(res.maxScore, 10);
    assert.strictEqual(res.result, 'recycle'); // 40%
  });

  await t.test('good_answer = no', () => {
    const questions = [
      { id: 1, text: 'Screen cracked?', weight: 10, is_disqualifier: false, good_answer: 'no' }
    ];
    // Answering 'no' should give max score
    const res = classify(questions, [{ question_id: 1, answer: 'no' }], 'device');
    assert.strictEqual(res.score, 10);
    assert.strictEqual(res.result, 'reuse');

    // Answering 'yes' should give 0 score
    const res2 = classify(questions, [{ question_id: 1, answer: 'yes' }], 'device');
    assert.strictEqual(res2.score, 0);
    assert.strictEqual(res2.result, 'recycle');
  });

  await t.test('empty question list', () => {
    const res = classify([], [], 'device');
    assert.strictEqual(res.score, 0);
    assert.strictEqual(res.maxScore, 0);
    assert.strictEqual(res.result, 'recycle'); // pct = 0
  });

});
