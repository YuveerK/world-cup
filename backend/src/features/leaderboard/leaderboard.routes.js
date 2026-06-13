'use strict';

const { Router } = require('express');
const { getLeaderboard } = require('./leaderboard.controller');

const router = Router();

router.get('/', getLeaderboard);

module.exports = router;
