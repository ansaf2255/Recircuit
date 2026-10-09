require('dotenv').config({ path: './.env' });
const { pool } = require('./src/db/pool');

async function addDigitalAppliance() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add category
    const catRes = await client.query(`
      INSERT INTO categories (name) VALUES ('Digital Appliance')
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name;
    `);
    const catId = catRes.rows[0].id;
    console.log('Category ID:', catId);

    // Add device-level questions
    const deviceQuestions = [
      { text: 'Does the appliance power on?', goodAns: 'yes', weight: 15, disq: false, order: 1 },
      { text: 'Is the storage drive functioning?', goodAns: 'yes', weight: 15, disq: false, order: 2 },
      { text: 'Are there any clicking or grinding noises?', goodAns: 'no', weight: 5, disq: true, order: 3 },
      { text: 'Are the connection ports undamaged?', goodAns: 'yes', weight: 8, disq: false, order: 4 },
      { text: 'Does it pass S.M.A.R.T. status checks (if applicable)?', goodAns: 'yes', weight: 10, disq: false, order: 5 },
      { text: 'Is there physical damage to the casing?', goodAns: 'no', weight: 5, disq: false, order: 6 },
    ];

    for (const q of deviceQuestions) {
      await client.query(
        `INSERT INTO questions (category_id, text, good_answer, weight, is_disqualifier, display_order)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [catId, q.text, q.goodAns, q.weight, q.disq, q.order],
      );
    }
    console.log('Device questions added');

    // Add components
    const components = ['Storage Drive', 'Controller Board', 'Casing', 'Power Connector'];
    const compIds = {};
    for (const name of components) {
      const res = await client.query(`INSERT INTO components (category_id, name) VALUES ($1,$2) RETURNING id`, [catId, name]);
      compIds[name] = res.rows[0].id;
    }
    console.log('Components added');

    // Add component questions
    const compQuestions = [
      // Storage Drive
      { comp: 'Storage Drive', text: 'Are there bad sectors or errors?', goodAns: 'no', weight: 10, disq: false, order: 1 },
      { comp: 'Storage Drive', text: 'Does the drive make unusual noises?', goodAns: 'no', weight: 0, disq: true, order: 2 },
      
      // Controller Board
      { comp: 'Controller Board', text: 'Is the board functioning correctly?', goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { comp: 'Controller Board', text: 'Are there visible burn marks or corrosion?', goodAns: 'no', weight: 0, disq: true, order: 2 },
      
      // Casing
      { comp: 'Casing', text: 'Is the casing intact without cracks?', goodAns: 'yes', weight: 10, disq: false, order: 1 },
      
      // Power Connector
      { comp: 'Power Connector', text: 'Is the connector physically damaged?', goodAns: 'no', weight: 0, disq: true, order: 1 },
      { comp: 'Power Connector', text: 'Does it supply power reliably?', goodAns: 'yes', weight: 10, disq: false, order: 2 },
    ];

    for (const q of compQuestions) {
      await client.query(
        `INSERT INTO component_questions (component_id, text, good_answer, weight, is_disqualifier, display_order)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [compIds[q.comp], q.text, q.goodAns, q.weight, q.disq, q.order],
      );
    }
    console.log('Component questions added');

    await client.query('COMMIT');
    console.log('Successfully added Digital Appliance category!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

addDigitalAppliance();
