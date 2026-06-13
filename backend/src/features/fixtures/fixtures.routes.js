'use strict';

const { Router } = require('express');
const { getFixtures, getLiveFixtures, getTodayFixtures } = require('./fixtures.controller');

const router = Router();

router.get('/', getFixtures);
router.get('/live', getLiveFixtures);
router.get('/today', getTodayFixtures);

module.exports = router;
