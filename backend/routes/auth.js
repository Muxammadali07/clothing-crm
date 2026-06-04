const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Manager-only: create new staff accounts
router.post('/register', protect(['manager']), ctrl.register);
router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', protect(), ctrl.getMe);

module.exports = router;
