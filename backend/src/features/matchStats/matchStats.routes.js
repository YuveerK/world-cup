'use strict';

const { Router } = require('express');
const { getStats } = require('./matchStats.controller');

const router = Router({ mergeParams: true });

// Mounted at /fixtures/:matchId/stats by app.js
router.get('/', getStats);

module.exports = router;
