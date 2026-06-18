const express = require('express');
const router = express.Router();
const {
  registerOrganization,
  loginOrganization,
  loginGuard,
  getMe,
  updateOrgProfile,
} = require('../controllers/authController');
const { protect, requireAdmin } = require('../middleware/auth');

router.post('/org/register', registerOrganization);
router.post('/org/login', loginOrganization);
router.post('/guard/login', loginGuard);
router.get('/me', protect, getMe);
router.put('/org/profile', protect, requireAdmin, updateOrgProfile);

module.exports = router;
