'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const requireAuth = require('../../shared/middleware/requireAuth');
const validate = require('../../shared/validation/validate');
const ctrl = require('./auth.controller');
const schemas = require('./auth.schemas');

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

router.post('/signup', authLimiter, validate(schemas.validateSignup), ctrl.signup);
router.post('/login', authLimiter, validate(schemas.validateLogin), ctrl.login);
router.get('/me', requireAuth, ctrl.getMe);
router.put('/username', requireAuth, validate(schemas.validateChangeUsername), ctrl.changeUsername);
router.put('/password', requireAuth, validate(schemas.validateChangePassword), ctrl.changePassword);
router.delete('/account', requireAuth, validate(schemas.validateDeleteAccount), ctrl.deleteAccount);
router.put('/picks', requireAuth, validate(schemas.validatePicks), ctrl.updatePicks);

module.exports = router;
