const express = require('express');
const router = express.Router();
const { register, login, getMe, addVehicle } = require('../controllers/vehicleUserController');
const { protect, requireVehicleUser } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, requireVehicleUser, getMe);
router.post('/vehicles', protect, requireVehicleUser, addVehicle);

module.exports = router;