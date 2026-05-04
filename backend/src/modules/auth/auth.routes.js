const router = require('express').Router();
const ctrl = require('./auth.controller');
const { validate, loginSchema, refreshSchema, logoutSchema } = require('../../utils/validators');

router.post('/login',   validate(loginSchema),   ctrl.login);
router.post('/refresh', validate(refreshSchema),  ctrl.refresh);
router.post('/logout',  validate(logoutSchema),   ctrl.logout);

module.exports = router;
