const express = require('express');
const router = express.Router();
const { getAreas, createArea, updateArea, deleteArea } = require('../controllers/areaController');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect);

router.get('/', getAreas);
router.post('/', requireAdmin, createArea);
router.put('/:id', requireAdmin, updateArea);
router.delete('/:id', requireAdmin, deleteArea);

module.exports = router;
