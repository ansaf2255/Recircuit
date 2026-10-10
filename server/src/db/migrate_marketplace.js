const { pool } = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Applying marketplace & component enhancements...');
    await client.query(`
      ALTER TABLE component_classifications 
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available',
      ADD COLUMN IF NOT EXISTS buyer_id INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
    `);
    
    // Ensure latitude and longitude columns exist on devices
    await client.query(`
      ALTER TABLE devices
      ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
    `);

    console.log('✅ Marketplace migration applied successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
