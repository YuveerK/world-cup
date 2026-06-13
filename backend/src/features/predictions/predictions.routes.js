'use strict';

const { Router } = require('express');
const requireAuth = require('../../shared/middleware/requireAuth');
const validate = require('../../shared/validation/validate');
const ctrl = require('./predictions.controller');
const { validateSubmitPrediction } = require('./predictions.schemas');

const router = Router();

router.get('/my', requireAuth, ctrl.getMyPredictions);
router.get('/my/points', requireAuth, ctrl.getMyPoints);
router.get('/:matchId/all', requireAuth, ctrl.getMatchPredictions);
router.post('/:matchId', requireAuth, validate(validateSubmitPrediction), ctrl.submit);

module.exports = router;
