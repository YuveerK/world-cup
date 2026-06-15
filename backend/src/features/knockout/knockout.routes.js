'use strict';

const { Router } = require('express');
const { getBracket } = require('./knockout.controller');

const router = Router();

router.get('/', getBracket);

module.exports = router;
