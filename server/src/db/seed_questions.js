const { pool } = require('./pool');

async function seedIntelligentQuestions() {
  const client = await pool.connect();
  try {
    console.log('⏳ Seeding intelligent inspection questions and categories…');
    await client.query('BEGIN');

    // 1. Ensure all 4 categories exist
    const categories = ['Mobile', 'Laptop', 'Home Appliance', 'Digital Appliance'];
    const catMap = {};
    for (const cat of categories) {
      const res = await client.query(
        `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name`,
        [cat]
      );
      catMap[res.rows[0].name] = res.rows[0].id;
    }

    // 2. Clear old responses and questions
    await client.query('DELETE FROM responses');
    await client.query('DELETE FROM questions');

    // 3. Define questions with sections and power dependencies
    const questions = [
      // ═════════════════ MOBILE ═════════════════
      { cat: 'Mobile', section: 'power', text: 'Does the mobile device turn on and boot to the home screen?', goodAns: 'yes', weight: 20, disq: false, reqPower: false, order: 1 },
      { cat: 'Mobile', section: 'power', text: 'Is the operating system accessible (free of activation/iCloud/Google locks)?', goodAns: 'yes', weight: 15, disq: true, reqPower: true, order: 2 },
      { cat: 'Mobile', section: 'screen', text: 'Is the screen glass free of visible cracks, chips, or deep scratches?', goodAns: 'yes', weight: 12, disq: false, reqPower: false, order: 3 },
      { cat: 'Mobile', section: 'screen', text: 'Does the touchscreen register touch seamlessly across all areas of the display?', goodAns: 'yes', weight: 10, disq: false, reqPower: true, order: 4 },
      { cat: 'Mobile', section: 'screen', text: 'Is the display screen free of colored lines, flickering, or dark patches?', goodAns: 'yes', weight: 10, disq: false, reqPower: true, order: 5 },
      { cat: 'Mobile', section: 'body', text: 'Is the back panel / housing free of cracks and heavy structural dents?', goodAns: 'yes', weight: 8, disq: false, reqPower: false, order: 6 },
      { cat: 'Mobile', section: 'body', text: 'Is the frame straight without any bending or warping?', goodAns: 'yes', weight: 8, disq: false, reqPower: false, order: 7 },
      { cat: 'Mobile', section: 'hardware', text: 'Are the front and rear cameras taking clear photos without blur or spots?', goodAns: 'yes', weight: 8, disq: false, reqPower: true, order: 8 },
      { cat: 'Mobile', section: 'hardware', text: 'Do the speakers and microphone work clearly during phone calls?', goodAns: 'yes', weight: 7, disq: false, reqPower: true, order: 9 },
      { cat: 'Mobile', section: 'hardware', text: 'Does the battery hold a steady charge for normal daily use (>80% health)?', goodAns: 'yes', weight: 10, disq: false, reqPower: true, order: 10 },
      { cat: 'Mobile', section: 'hardware', text: 'Are all physical buttons (power, volume) and the charging port functional?', goodAns: 'yes', weight: 7, disq: false, reqPower: false, order: 11 },
      { cat: 'Mobile', section: 'hazard', text: 'Is there any liquid damage indicator triggered, or signs of water exposure?', goodAns: 'no', weight: 0, disq: true, reqPower: false, order: 12 },
      { cat: 'Mobile', section: 'hazard', text: 'Are there signs of battery swelling or bulging casing?', goodAns: 'no', weight: 0, disq: true, reqPower: false, order: 13 },

      // ═════════════════ LAPTOP ═════════════════
      { cat: 'Laptop', section: 'power', text: 'Does the laptop turn on and boot up into the operating system?', goodAns: 'yes', weight: 20, disq: false, reqPower: false, order: 1 },
      { cat: 'Laptop', section: 'power', text: 'Is the laptop free of BIOS passwords or MDM corporate enrollment locks?', goodAns: 'yes', weight: 15, disq: true, reqPower: true, order: 2 },
      { cat: 'Laptop', section: 'screen', text: 'Does the display produce a crisp image with working backlight and intact hinges?', goodAns: 'yes', weight: 12, disq: false, reqPower: false, order: 3 },
      { cat: 'Laptop', section: 'screen', text: 'Is the screen glass free of cracks, dead pixels, or pressure marks?', goodAns: 'yes', weight: 10, disq: false, reqPower: true, order: 4 },
      { cat: 'Laptop', section: 'body', text: 'Are all keyboard keys and the trackpad fully responsive?', goodAns: 'yes', weight: 10, disq: false, reqPower: true, order: 5 },
      { cat: 'Laptop', section: 'body', text: 'Is the chassis / casing free of major cracks, broken corners, or heavy dents?', goodAns: 'yes', weight: 8, disq: false, reqPower: false, order: 6 },
      { cat: 'Laptop', section: 'hardware', text: 'Does the laptop connect reliably to Wi-Fi and Bluetooth?', goodAns: 'yes', weight: 8, disq: false, reqPower: true, order: 7 },
      { cat: 'Laptop', section: 'hardware', text: 'Do the USB and charging ports recognize connected devices properly?', goodAns: 'yes', weight: 8, disq: false, reqPower: true, order: 8 },
      { cat: 'Laptop', section: 'hardware', text: 'Does the battery hold power unplugged for at least 2 hours?', goodAns: 'yes', weight: 10, disq: false, reqPower: true, order: 9 },
      { cat: 'Laptop', section: 'hazard', text: 'Has the laptop ever been subjected to liquid spills or water ingress?', goodAns: 'no', weight: 0, disq: true, reqPower: false, order: 10 },
      { cat: 'Laptop', section: 'hazard', text: 'Are there any burn marks, burning electrical odors, or swollen battery signs?', goodAns: 'no', weight: 0, disq: true, reqPower: false, order: 11 },

      // ═════════════════ HOME APPLIANCE ═════════════════
      { cat: 'Home Appliance', section: 'power', text: 'Does the appliance power on and respond to user controls?', goodAns: 'yes', weight: 25, disq: false, reqPower: false, order: 1 },
      { cat: 'Home Appliance', section: 'power', text: 'Does it complete its primary operation cycle (e.g. wash/spin, cooling, heating)?', goodAns: 'yes', weight: 20, disq: false, reqPower: true, order: 2 },
      { cat: 'Home Appliance', section: 'hardware', text: 'Is the motor / compressor running smoothly without grinding or excessive vibration?', goodAns: 'yes', weight: 15, disq: false, reqPower: true, order: 3 },
      { cat: 'Home Appliance', section: 'hardware', text: 'Do all display panels, indicators, and dials function accurately?', goodAns: 'yes', weight: 10, disq: false, reqPower: true, order: 4 },
      { cat: 'Home Appliance', section: 'body', text: 'Is the outer cabinet/body free of severe rust, structural dents, or door seal damage?', goodAns: 'yes', weight: 12, disq: false, reqPower: false, order: 5 },
      { cat: 'Home Appliance', section: 'body', text: 'Is the power cord and wall plug intact without fraying, cuts, or tape repairs?', goodAns: 'yes', weight: 10, disq: false, reqPower: false, order: 6 },
      { cat: 'Home Appliance', section: 'hazard', text: 'Does the appliance emit any burning smell, electrical sparks, or smoke during operation?', goodAns: 'no', weight: 0, disq: true, reqPower: false, order: 7 },
      { cat: 'Home Appliance', section: 'hazard', text: 'Are there any active electrical leakages or severe pipe ruptures?', goodAns: 'no', weight: 0, disq: true, reqPower: false, order: 8 },

      // ═════════════════ DIGITAL APPLIANCE ═════════════════
      { cat: 'Digital Appliance', section: 'power', text: 'Does the device power on and output signal to the screen/monitor?', goodAns: 'yes', weight: 25, disq: false, reqPower: false, order: 1 },
      { cat: 'Digital Appliance', section: 'power', text: 'Does the system software boot to the dashboard without overheating shutoff?', goodAns: 'yes', weight: 20, disq: false, reqPower: true, order: 2 },
      { cat: 'Digital Appliance', section: 'hardware', text: 'Are the HDMI and video output ports functioning and undamaged?', goodAns: 'yes', weight: 15, disq: false, reqPower: true, order: 3 },
      { cat: 'Digital Appliance', section: 'hardware', text: 'Do controllers, USB peripherals, or remotes pair and connect reliably?', goodAns: 'yes', weight: 12, disq: false, reqPower: true, order: 4 },
      { cat: 'Digital Appliance', section: 'hardware', text: 'Does the internal storage / disc drive read and store data normally?', goodAns: 'yes', weight: 12, disq: false, reqPower: true, order: 5 },
      { cat: 'Digital Appliance', section: 'body', text: 'Is the external enclosure free of cracked panels, missing vents, or broken ports?', goodAns: 'yes', weight: 10, disq: false, reqPower: false, order: 6 },
      { cat: 'Digital Appliance', section: 'hardware', text: 'Are the internal cooling fans clean and free of loud buzzing or burning odors?', goodAns: 'yes', weight: 6, disq: false, reqPower: true, order: 7 },
      { cat: 'Digital Appliance', section: 'hazard', text: 'Has the device suffered any liquid damage or internal power supply short circuits?', goodAns: 'no', weight: 0, disq: true, reqPower: false, order: 8 },
    ];

    for (const q of questions) {
      await client.query(
        `INSERT INTO questions (category_id, text, answer_type, good_answer, weight, is_disqualifier, section, requires_power, display_order)
         VALUES ($1, $2, 'yes_no', $3, $4, $5, $6, $7, $8)`,
        [catMap[q.cat], q.text, q.goodAns, q.weight, q.disq, q.section, q.reqPower, q.order]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully seeded ${questions.length} intelligent questions across all categories.`);
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed questions:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedIntelligentQuestions();
