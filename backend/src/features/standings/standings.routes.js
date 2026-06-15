'use strict';

const { Router } = require('express');
const { getStandings, getFlagImage } = require('./standings.controller');

const router = Router();

router.get('/flags/:code', getFlagImage);
router.get('/', getStandings);

module.exports = router;
