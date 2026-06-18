const express = require('express');
const router = express.Router();
const {
  createSession,
  getSessions,
  getSessionByToken,
  checkoutSession,
  publicCheckout,
  getAnalytics,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');

// Public routes (no auth needed - for QR scan)
router.get('/public/:token', getSessionByToken);
router.put('/public/:token/checkout', publicCheckout);

// Protected routes
router.use(protect);

router.get('/', getSessions);
router.get('/analytics', getAnalytics);
router.post('/', createSession);
router.put('/:id/checkout', checkoutSession);

module.exports = router;
