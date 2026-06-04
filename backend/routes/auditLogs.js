const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { list } = require('../controllers/auditController');

router.get('/', protect(['manager']), list);

module.exports = router;
