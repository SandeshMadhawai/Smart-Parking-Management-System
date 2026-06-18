const express = require('express');
const router = express.Router();
const {
  getSlots,
  getSlotsByArea,
  createSlot,
  createSlotsBulk,
  updateSlot,
  deleteSlot,
} = require('../controllers/slotController');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect);

router.get('/', getSlots);
router.get('/by-area', getSlotsByArea);
router.post('/', requireAdmin, createSlot);
router.post('/bulk', requireAdmin, createSlotsBulk);
router.put('/:id', requireAdmin, updateSlot);
router.delete('/:id', requireAdmin, deleteSlot);

module.exports = router;
