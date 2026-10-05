/**
 * Seed script — populates categories, device-level questions,
 * components & component questions, and a default admin user.
 *
 * Run with:  npm run db:seed
 */
const bcrypt = require('bcrypt');
const { pool } = require('./pool');

async function seed() {
  console.log('⏳ Seeding database…');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Categories ────────────────────────────────────────────────
    const catRes = await client.query(`
      INSERT INTO categories (name) VALUES ('Mobile'),('Laptop'),('Home Appliance')
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name;
    `);
    const cats = {};
    catRes.rows.forEach((r) => (cats[r.name] = r.id));
    console.log('  Categories:', Object.keys(cats).join(', '));

    // ── Device-level questions (all 3 categories) ─────────────────
    const deviceQuestions = [
      // Mobile
      { cat: 'Mobile', text: 'Does the device power on?',                weight: 15, disq: false, order: 1 },
      { cat: 'Mobile', text: 'Is the screen cracked or damaged?',        weight: 10, disq: false, order: 2 },
      { cat: 'Mobile', text: 'Does the touchscreen respond normally?',   weight: 10, disq: false, order: 3 },
      { cat: 'Mobile', text: 'Does it hold charge for at least 2 hours?',weight: 10, disq: false, order: 4 },
      { cat: 'Mobile', text: 'Is there any water damage indicator triggered?', weight: 5, disq: true, order: 5 },
      { cat: 'Mobile', text: 'Are all physical buttons functional?',     weight: 5,  disq: false, order: 6 },

      // Laptop
      { cat: 'Laptop', text: 'Does the laptop power on?',               weight: 15, disq: false, order: 1 },
      { cat: 'Laptop', text: 'Does the display show a clear image?',    weight: 10, disq: false, order: 2 },
      { cat: 'Laptop', text: 'Is the keyboard fully functional?',       weight: 8,  disq: false, order: 3 },
      { cat: 'Laptop', text: 'Does it connect to Wi-Fi?',               weight: 5,  disq: false, order: 4 },
      { cat: 'Laptop', text: 'Is the battery removable and swollen?',   weight: 5,  disq: true,  order: 5 },
      { cat: 'Laptop', text: 'Does it boot to the operating system?',   weight: 12, disq: false, order: 6 },
      { cat: 'Laptop', text: 'Are there any burn marks or smoke damage?',weight: 0,  disq: true,  order: 7 },

      // Home Appliance
      { cat: 'Home Appliance', text: 'Does the appliance turn on?',      weight: 15, disq: false, order: 1 },
      { cat: 'Home Appliance', text: 'Does it perform its primary function?', weight: 15, disq: false, order: 2 },
      { cat: 'Home Appliance', text: 'Is the power cord intact?',       weight: 5,  disq: false, order: 3 },
      { cat: 'Home Appliance', text: 'Are there any exposed wires?',    weight: 0,  disq: true,  order: 4 },
      { cat: 'Home Appliance', text: 'Is the exterior casing undamaged?',weight: 8,  disq: false, order: 5 },
      { cat: 'Home Appliance', text: 'Does it produce unusual noise or smell?', weight: 5, disq: true, order: 6 },
    ];

    for (const q of deviceQuestions) {
      await client.query(
        `INSERT INTO questions (category_id, text, weight, is_disqualifier, display_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [cats[q.cat], q.text, q.weight, q.disq, q.order],
      );
    }
    console.log('  Device questions seeded:', deviceQuestions.length);

    // ── Components (Laptop) ───────────────────────────────────────
    const laptopComponents = ['Battery', 'RAM', 'Storage', 'Display', 'Keyboard', 'Motherboard'];
    const compIds = {};
    for (const name of laptopComponents) {
      const res = await client.query(
        `INSERT INTO components (category_id, name) VALUES ($1,$2) RETURNING id`,
        [cats['Laptop'], name],
      );
      compIds[name] = res.rows[0].id;
    }
    console.log('  Laptop components seeded:', laptopComponents.join(', '));

    // ── Component questions ───────────────────────────────────────
    const compQuestions = [
      // Battery
      { comp: 'Battery', text: 'Does the battery hold charge normally?',      weight: 10, disq: false, order: 1 },
      { comp: 'Battery', text: 'Any swelling or leakage?',                    weight: 0,  disq: true,  order: 2 },
      { comp: 'Battery', text: 'Does the battery drain unusually fast?',      weight: 6,  disq: false, order: 3 },

      // RAM
      { comp: 'RAM', text: 'Is the RAM detected by the system?',             weight: 10, disq: false, order: 1 },
      { comp: 'RAM', text: 'Are there frequent blue-screens or memory errors?',weight: 8,  disq: false, order: 2 },
      { comp: 'RAM', text: 'Is the RAM module physically damaged or corroded?',weight: 0,  disq: true,  order: 3 },

      // Storage
      { comp: 'Storage', text: 'Is the storage drive detected at boot?',      weight: 10, disq: false, order: 1 },
      { comp: 'Storage', text: 'Are there bad sectors or S.M.A.R.T. warnings?',weight: 8,  disq: false, order: 2 },
      { comp: 'Storage', text: 'Does the drive make clicking/grinding noises?',weight: 0,  disq: true,  order: 3 },

      // Display
      { comp: 'Display', text: 'Does the display produce a clear image?',     weight: 10, disq: false, order: 1 },
      { comp: 'Display', text: 'Are there dead pixels or lines on screen?',   weight: 6,  disq: false, order: 2 },
      { comp: 'Display', text: 'Is the screen cracked or shattered?',         weight: 0,  disq: true,  order: 3 },

      // Keyboard
      { comp: 'Keyboard', text: 'Do all keys register correctly?',            weight: 10, disq: false, order: 1 },
      { comp: 'Keyboard', text: 'Are any keys physically missing or stuck?',  weight: 6,  disq: false, order: 2 },

      // Motherboard
      { comp: 'Motherboard', text: 'Does the motherboard POST successfully?', weight: 10, disq: false, order: 1 },
      { comp: 'Motherboard', text: 'Are there any visible burn marks or corrosion?', weight: 0, disq: true, order: 2 },
      { comp: 'Motherboard', text: 'Do all ports (USB, HDMI, etc.) function?',weight: 6,  disq: false, order: 3 },
    ];

    for (const q of compQuestions) {
      await client.query(
        `INSERT INTO component_questions (component_id, text, weight, is_disqualifier, display_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [compIds[q.comp], q.text, q.weight, q.disq, q.order],
      );
    }
    console.log('  Component questions seeded:', compQuestions.length);

    // ── Default admin user ────────────────────────────────────────
    const adminHash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, location, verified)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (email) DO NOTHING`,
      ['Admin', 'admin@recircuit.com', adminHash, 'admin', 'Headquarters', true],
    );

    // ── Sample recycler & refurbisher for matching demos ──────────
    const recyclerHash = await bcrypt.hash('recycler123', 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, location, verified)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (email) DO NOTHING`,
      ['GreenTech Recyclers', 'recycler@recircuit.com', recyclerHash, 'recycler', 'Mumbai', true],
    );

    const refurbHash = await bcrypt.hash('refurbisher123', 10);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, location, verified)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (email) DO NOTHING`,
      ['ReNew Electronics', 'refurbisher@recircuit.com', refurbHash, 'refurbisher', 'Delhi', true],
    );

    console.log('  Default users seeded (admin / recycler / refurbisher)');

    await client.query('COMMIT');
    console.log('✅ Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
