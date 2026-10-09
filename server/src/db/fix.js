const { pool } = require('./pool');

async function fix() {
  const client = await pool.connect();
  try {
    await client.query("UPDATE questions SET is_disqualifier = true WHERE text ILIKE '%power on%' OR text ILIKE '%turn on%';");
    console.log('✅ Successfully updated power/turn on questions to be disqualifiers in the active database.');
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fix();
