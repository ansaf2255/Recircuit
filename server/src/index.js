/**
 * ReCircuit — Express server entry point.
 *
 * Electronics recovery, reuse & recycler matching platform with a
 * rule-based component assessment engine.
 */
require('dotenv').config();

const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`Fatal Error: Missing required environment variable(s): ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/devices',       require('./routes/devices'));
app.use('/api/categories',    require('./routes/categories'));
app.use('/api/questionnaire', require('./routes/questionnaire'));
app.use('/api/components',    require('./routes/components'));
app.use('/api/matches',       require('./routes/matches'));
app.use('/api/requests',      require('./routes/requests'));
app.use('/api/admin',         require('./routes/admin'));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ReCircuit API', timestamp: new Date().toISOString() });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 ReCircuit API running on http://localhost:${PORT}`);
});
