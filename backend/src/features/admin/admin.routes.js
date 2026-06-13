'use strict';

const { Router } = require('express');
const requireAuth = require('../../shared/middleware/requireAuth');
const requireAdmin = require('../../shared/middleware/requireAdmin');
const validate = require('../../shared/validation/validate');
const ctrl = require('./admin.controller');
const schemas = require('./admin.schemas');

const router = Router();
const guard = [requireAuth, requireAdmin];

router.get('/users', ...guard, ctrl.getUsers);
router.post('/signup', ...guard, validate(schemas.validateAdminSignup), ctrl.createUser);
router.get('/predictions/:matchId', ...guard, ctrl.getPredictions);
router.put('/users/:userId/picks', ...guard, ctrl.updatePicks);
router.put('/users/:userId/password', ...guard, validate(schemas.validateResetPassword), ctrl.resetPassword);
router.delete('/users/:userId', ...guard, ctrl.deleteUser);
router.post('/users/:userId/predict/:matchId', ...guard, validate(schemas.validateSetPrediction), ctrl.setUserPrediction);

module.exports = router;
