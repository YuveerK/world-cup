'use strict';

const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/cors');

const fixturesRoutes = require('./features/fixtures/fixtures.routes');
const matchStatsRoutes = require('./features/matchStats/matchStats.routes');
const authRoutes = require('./features/auth/auth.routes');
const predictionsRoutes = require('./features/predictions/predictions.routes');
const scoringRoutes = require('./features/scoring/scoring.routes');
const leaderboardRoutes = require('./features/leaderboard/leaderboard.routes');
const adminRoutes = require('./features/admin/admin.routes');

const notFound = require('./shared/middleware/notFound');
const errorHandler = require('./shared/middleware/errorHandler');

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '50kb' }));

// Health check — imported by tests to confirm app boots without side effects
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// FIFA proxy routes
app.use('/fixtures', fixturesRoutes);
app.use('/fixtures/:matchId/stats', matchStatsRoutes);

// Game routes
app.use('/auth', authRoutes);
app.use('/predictions', predictionsRoutes);
app.use('/scoring', scoringRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/admin', adminRoutes);

// Catch-all 404 then central error handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
