'use strict';

const { Router } = require('express');
const requireAuth = require('../../shared/middleware/requireAuth');
const validate = require('../../shared/validation/validate');
const ctrl = require('./auth.controller');
const schemas = require('./auth.schemas');

const router = Router();

router.post('/signup', validate(schemas.validateSignup), ctrl.signup);
router.post('/login', validate(schemas.validateLogin), ctrl.login);
router.get('/me', requireAuth, ctrl.getMe);
router.put('/username', requireAuth, validate(schemas.validateChangeUsername), ctrl.changeUsername);
router.put('/password', requireAuth, validate(schemas.validateChangePassword), ctrl.changePassword);
router.delete('/account', requireAuth, validate(schemas.validateDeleteAccount), ctrl.deleteAccount);
router.put('/picks', requireAuth, validate(schemas.validatePicks), ctrl.updatePicks);

module.exports = router;
