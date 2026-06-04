const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { summary } = require('../controllers/reportController');

router.get('/summary', protect(['manager', 'admin']), summary);

module.exports = router;
