/**
 * Seed script — populates categories, device-level questions,
 * components & component questions, and a default admin user.
 *
 * Run with:  npm run db:seed
 */
const bcrypt = require('bcrypt');
const { pool } = require('./pool');

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot run db:seed in production!');
    process.exit(1);
  }
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
      { cat: 'Mobile', text: 'Does the device power on?',                goodAns: 'yes', weight: 15, disq: true, order: 1 },
      { cat: 'Mobile', text: 'Is the screen cracked or damaged?',        goodAns: 'no',  weight: 10, disq: false, order: 2 },
      { cat: 'Mobile', text: 'Does the touchscreen respond normally?',   goodAns: 'yes', weight: 10, disq: false, order: 3 },
      { cat: 'Mobile', text: 'Does it hold charge for at least 2 hours?',goodAns: 'yes', weight: 10, disq: false, order: 4 },
      { cat: 'Mobile', text: 'Is there any water damage indicator triggered?', goodAns: 'no', weight: 5, disq: true, order: 5 },
      { cat: 'Mobile', text: 'Are all physical buttons functional?',     goodAns: 'yes', weight: 5,  disq: false, order: 6 },

      // Laptop
      { cat: 'Laptop', text: 'Does the laptop power on?',               goodAns: 'yes', weight: 15, disq: true, order: 1 },
      { cat: 'Laptop', text: 'Does the display show a clear image?',    goodAns: 'yes', weight: 10, disq: false, order: 2 },
      { cat: 'Laptop', text: 'Is the keyboard fully functional?',       goodAns: 'yes', weight: 8,  disq: false, order: 3 },
      { cat: 'Laptop', text: 'Does it connect to Wi-Fi?',               goodAns: 'yes', weight: 5,  disq: false, order: 4 },
      { cat: 'Laptop', text: 'Is the battery removable and swollen?',   goodAns: 'no',  weight: 5,  disq: true,  order: 5 },
      { cat: 'Laptop', text: 'Does it boot to the operating system?',   goodAns: 'yes', weight: 12, disq: false, order: 6 },
      { cat: 'Laptop', text: 'Are there any burn marks or smoke damage?',goodAns: 'no', weight: 0,  disq: true,  order: 7 },

      // Home Appliance
      { cat: 'Home Appliance', text: 'Does the appliance turn on?',      goodAns: 'yes', weight: 15, disq: true, order: 1 },
      { cat: 'Home Appliance', text: 'Does it perform its primary function?', goodAns: 'yes', weight: 15, disq: false, order: 2 },
      { cat: 'Home Appliance', text: 'Is the power cord intact?',       goodAns: 'yes', weight: 5,  disq: false, order: 3 },
      { cat: 'Home Appliance', text: 'Are there any exposed wires?',    goodAns: 'no',  weight: 0,  disq: true,  order: 4 },
      { cat: 'Home Appliance', text: 'Is the exterior casing undamaged?',goodAns: 'yes', weight: 8,  disq: false, order: 5 },
      { cat: 'Home Appliance', text: 'Does it produce unusual noise or smell?', goodAns: 'no', weight: 5, disq: true, order: 6 },
    ];

    for (const q of deviceQuestions) {
      await client.query(
        `INSERT INTO questions (category_id, text, good_answer, weight, is_disqualifier, display_order)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [cats[q.cat], q.text, q.goodAns, q.weight, q.disq, q.order],
      );
    }
    console.log('  Device questions seeded:', deviceQuestions.length);

    const laptopComponents = ['Battery', 'RAM', 'Storage', 'Display', 'Keyboard', 'Motherboard'];
    const mobileComponents = ['Battery', 'Screen', 'Camera', 'Motherboard', 'Speaker/Mic'];
    const applianceComponents = ['Motor/Heating Element', 'Control Board', 'Power Cord', 'Casing'];
    
    const compIds = {};
    for (const name of laptopComponents) {
      const res = await client.query(`INSERT INTO components (category_id, name) VALUES ($1,$2) RETURNING id`, [cats['Laptop'], name]);
      compIds[`Laptop_${name}`] = res.rows[0].id;
    }
    for (const name of mobileComponents) {
      const res = await client.query(`INSERT INTO components (category_id, name) VALUES ($1,$2) RETURNING id`, [cats['Mobile'], name]);
      compIds[`Mobile_${name}`] = res.rows[0].id;
    }
    for (const name of applianceComponents) {
      const res = await client.query(`INSERT INTO components (category_id, name) VALUES ($1,$2) RETURNING id`, [cats['Home Appliance'], name]);
      compIds[`Home Appliance_${name}`] = res.rows[0].id;
    }
    console.log('  Components seeded for all categories');

    // ── Component questions ───────────────────────────────────────
    const compQuestions = [
      // Laptop Battery
      { cat: 'Laptop', comp: 'Battery', text: 'Does the battery hold charge normally?',      goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Laptop', comp: 'Battery', text: 'Any swelling or leakage?',                    goodAns: 'no',  weight: 0,  disq: true,  order: 2 },
      { cat: 'Laptop', comp: 'Battery', text: 'Does the battery drain unusually fast?',      goodAns: 'no',  weight: 6,  disq: false, order: 3 },

      // Laptop RAM
      { cat: 'Laptop', comp: 'RAM', text: 'Is the RAM detected by the system?',             goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Laptop', comp: 'RAM', text: 'Are there frequent blue-screens or memory errors?',goodAns: 'no',  weight: 8,  disq: false, order: 2 },
      { cat: 'Laptop', comp: 'RAM', text: 'Is the RAM module physically damaged or corroded?',goodAns: 'no',  weight: 0,  disq: true,  order: 3 },

      // Laptop Storage
      { cat: 'Laptop', comp: 'Storage', text: 'Is the storage drive detected at boot?',      goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Laptop', comp: 'Storage', text: 'Are there bad sectors or S.M.A.R.T. warnings?',goodAns: 'no',  weight: 8,  disq: false, order: 2 },
      { cat: 'Laptop', comp: 'Storage', text: 'Does the drive make clicking/grinding noises?',goodAns: 'no',  weight: 0,  disq: true,  order: 3 },

      // Laptop Display
      { cat: 'Laptop', comp: 'Display', text: 'Does the display produce a clear image?',     goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Laptop', comp: 'Display', text: 'Are there dead pixels or lines on screen?',   goodAns: 'no',  weight: 6,  disq: false, order: 2 },
      { cat: 'Laptop', comp: 'Display', text: 'Is the screen cracked or shattered?',         goodAns: 'no',  weight: 0,  disq: true,  order: 3 },

      // Laptop Keyboard
      { cat: 'Laptop', comp: 'Keyboard', text: 'Do all keys register correctly?',            goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Laptop', comp: 'Keyboard', text: 'Are any keys physically missing or stuck?',  goodAns: 'no',  weight: 6,  disq: false, order: 2 },

      // Laptop Motherboard
      { cat: 'Laptop', comp: 'Motherboard', text: 'Does the motherboard POST successfully?', goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Laptop', comp: 'Motherboard', text: 'Are there any visible burn marks or corrosion?', goodAns: 'no', weight: 0, disq: true, order: 2 },
      { cat: 'Laptop', comp: 'Motherboard', text: 'Do all ports (USB, HDMI, etc.) function?',goodAns: 'yes', weight: 6,  disq: false, order: 3 },

      // Mobile Battery
      { cat: 'Mobile', comp: 'Battery', text: 'Does the battery hold charge without dropping rapidly?', goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Mobile', comp: 'Battery', text: 'Is the battery swollen, pushing the screen/back out?', goodAns: 'no', weight: 0, disq: true, order: 2 },
      
      // Mobile Screen
      { cat: 'Mobile', comp: 'Screen', text: 'Is the glass intact without deep cracks?', goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Mobile', comp: 'Screen', text: 'Does the display show colors correctly without dead zones?', goodAns: 'yes', weight: 10, disq: false, order: 2 },
      
      // Mobile Camera
      { cat: 'Mobile', comp: 'Camera', text: 'Does the camera app open and show a clear image?', goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Mobile', comp: 'Camera', text: 'Are the camera lenses physically cracked?', goodAns: 'no', weight: 0, disq: true, order: 2 },

      // Mobile Motherboard
      { cat: 'Mobile', comp: 'Motherboard', text: 'Does the device turn on and boot?', goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Mobile', comp: 'Motherboard', text: 'Is it completely unresponsive/dead?', goodAns: 'no', weight: 0, disq: true, order: 2 },

      // Mobile Speaker/Mic
      { cat: 'Mobile', comp: 'Speaker/Mic', text: 'Is sound clear without crackling?', goodAns: 'yes', weight: 10, disq: false, order: 1 },

      // Home Appliance Motor/Heating Element
      { cat: 'Home Appliance', comp: 'Motor/Heating Element', text: 'Does it produce heat/spin normally when turned on?', goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Home Appliance', comp: 'Motor/Heating Element', text: 'Are there burning smells during operation?', goodAns: 'no', weight: 0, disq: true, order: 2 },
      
      // Home Appliance Control Board
      { cat: 'Home Appliance', comp: 'Control Board', text: 'Do the buttons and dials respond correctly?', goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Home Appliance', comp: 'Control Board', text: 'Are there visible burn marks on the board?', goodAns: 'no', weight: 0, disq: true, order: 2 },
      
      // Home Appliance Power Cord
      { cat: 'Home Appliance', comp: 'Power Cord', text: 'Is the cord free of cuts or exposed wires?', goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Home Appliance', comp: 'Power Cord', text: 'Is the plug physically damaged or melted?', goodAns: 'no', weight: 0, disq: true, order: 2 },
      
      // Home Appliance Casing
      { cat: 'Home Appliance', comp: 'Casing', text: 'Is the casing structurally sound?', goodAns: 'yes', weight: 10, disq: false, order: 1 },
      { cat: 'Home Appliance', comp: 'Casing', text: 'Are there severe dents or missing safety covers?', goodAns: 'no', weight: 0, disq: true, order: 2 },
    ];

    for (const q of compQuestions) {
      await client.query(
        `INSERT INTO component_questions (component_id, text, good_answer, weight, is_disqualifier, display_order)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [compIds[`${q.cat}_${q.comp}`], q.text, q.goodAns, q.weight, q.disq, q.order],
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
