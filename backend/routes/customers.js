const router = require('express').Router();
const { protect } = require('../middleware/auth');
const c = require('../controllers/customerController');

router.use(protect(['manager', 'admin']));
router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', c.get);
router.patch('/:id', c.update);
router.delete('/:id', c.remove);

module.exports = router;
