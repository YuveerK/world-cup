'use strict';

const { Router } = require('express');
const ctrl = require('./scoring.controller');

const router = Router();

router.post('/trigger', ctrl.trigger);
router.post('/set-result', ctrl.setResult);
router.post('/clear-result', ctrl.clearResult);

module.exports = router;
