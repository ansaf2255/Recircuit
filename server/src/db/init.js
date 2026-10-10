/**
 * Database schema initialisation script.
 * Run with:  npm run db:init
 */
const { pool } = require('./pool');

const schema = `
-- Drop tables in reverse-dependency order for clean re-init
DROP TABLE IF EXISTS requests        CASCADE;
DROP TABLE IF EXISTS matches         CASCADE;
DROP TABLE IF EXISTS component_classifications CASCADE;
DROP TABLE IF EXISTS component_responses       CASCADE;
DROP TABLE IF EXISTS component_questions       CASCADE;
DROP TABLE IF EXISTS components      CASCADE;
DROP TABLE IF EXISTS classifications CASCADE;
DROP TABLE IF EXISTS responses       CASCADE;
DROP TABLE IF EXISTS devices         CASCADE;
DROP TABLE IF EXISTS questions       CASCADE;
DROP TABLE IF EXISTS categories      CASCADE;
DROP TABLE IF EXISTS users           CASCADE;

-- ===================== USERS =====================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120)  NOT NULL,
    email           VARCHAR(180)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    role            VARCHAR(20)   NOT NULL CHECK (role IN ('seller','recycler','refurbisher','admin')),
    location        VARCHAR(180),
    verified        BOOLEAN       NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ===================== CATEGORIES =====================
CREATE TABLE categories (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
);

-- ===================== DEVICE-LEVEL QUESTIONS =====================
CREATE TABLE questions (
    id              SERIAL PRIMARY KEY,
    category_id     INTEGER       NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    text            TEXT          NOT NULL,
    answer_type     VARCHAR(20)   NOT NULL DEFAULT 'yes_no',
    good_answer     VARCHAR(3)    NOT NULL DEFAULT 'yes' CHECK (good_answer IN ('yes','no')),
    weight          INTEGER       NOT NULL DEFAULT 0,
    is_disqualifier BOOLEAN       NOT NULL DEFAULT false,
    section         VARCHAR(60)   NOT NULL DEFAULT 'general',
    requires_power  BOOLEAN       NOT NULL DEFAULT false,
    display_order   INTEGER       NOT NULL DEFAULT 0
);

-- ===================== DEVICES =====================
CREATE TABLE devices (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     INTEGER       NOT NULL REFERENCES categories(id),
    brand           VARCHAR(80),
    model           VARCHAR(120),
    description     TEXT,
    location        VARCHAR(180),
    images          JSONB         DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ===================== RESPONSES (device-level) =====================
CREATE TABLE responses (
    id          SERIAL PRIMARY KEY,
    device_id   INTEGER      NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    question_id INTEGER      NOT NULL REFERENCES questions(id),
    answer      VARCHAR(255) NOT NULL
);

-- ===================== CLASSIFICATIONS (device-level) =====================
CREATE TABLE classifications (
    id         SERIAL PRIMARY KEY,
    device_id  INTEGER      NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    result     VARCHAR(20)  NOT NULL CHECK (result IN ('reuse','resell','refurbish','recycle')),
    reasoning     TEXT,
    score         INTEGER,
    ai_inspection JSONB        DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ===================== COMPONENTS =====================
CREATE TABLE components (
    id          SERIAL PRIMARY KEY,
    category_id INTEGER     NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name        VARCHAR(80) NOT NULL
);

-- ===================== COMPONENT QUESTIONS =====================
CREATE TABLE component_questions (
    id              SERIAL PRIMARY KEY,
    component_id    INTEGER  NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    text            TEXT     NOT NULL,
    good_answer     VARCHAR(3) NOT NULL DEFAULT 'yes' CHECK (good_answer IN ('yes','no')),
    weight          INTEGER  NOT NULL DEFAULT 0,
    is_disqualifier BOOLEAN  NOT NULL DEFAULT false,
    display_order   INTEGER  NOT NULL DEFAULT 0
);

-- ===================== COMPONENT RESPONSES =====================
CREATE TABLE component_responses (
    id           SERIAL PRIMARY KEY,
    device_id    INTEGER      NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    component_id INTEGER      NOT NULL REFERENCES components(id),
    question_id  INTEGER      NOT NULL REFERENCES component_questions(id),
    answer       VARCHAR(255) NOT NULL
);

-- ===================== COMPONENT CLASSIFICATIONS =====================
CREATE TABLE component_classifications (
    id           SERIAL PRIMARY KEY,
    device_id    INTEGER     NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    component_id INTEGER     NOT NULL REFERENCES components(id),
    result       VARCHAR(20) NOT NULL CHECK (result IN ('reusable','recycle')),
    recommended_action VARCHAR(20) CHECK (recommended_action IN ('reuse_part','recycle_material')),
    reasoning    TEXT
);

-- ===================== MATCHES =====================
CREATE TABLE matches (
    id          SERIAL PRIMARY KEY,
    device_id   INTEGER     NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    partner_id  INTEGER     NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(device_id, partner_id)
);

-- ===================== REQUESTS =====================
CREATE TABLE requests (
    id         SERIAL PRIMARY KEY,
    match_id   INTEGER     NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    status     VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','completed','cancelled')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function init() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Cannot run db:init in production!');
    process.exit(1);
  }
  console.log('⏳ Initialising database schema…');
  try {
    await pool.query(schema);
    console.log('✅ Schema created successfully.');
  } catch (err) {
    console.error('❌ Schema init failed:', err.message);
  } finally {
    await pool.end();
  }
}

init();
