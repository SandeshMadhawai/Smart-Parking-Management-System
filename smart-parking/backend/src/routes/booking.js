const express = require('express');
const router = express.Router();
const {
  getAvailableSlots,
  createBooking,
  getMyBookings,
  checkPlateBooking,
  getBookingByToken,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect, requireVehicleUser, requireGuard } = require('../middleware/auth');

// Public
router.get('/public/:token', getBookingByToken);

// Vehicle user routes
router.get('/available-slots', getAvailableSlots);
router.post('/', protect, requireVehicleUser, createBooking);
router.get('/my', protect, requireVehicleUser, getMyBookings);
router.put('/:id/cancel', protect, requireVehicleUser, cancelBooking);

// Guard routes
router.get('/check-plate/:vehicleNumber', protect, requireGuard, checkPlateBooking);

module.exports = router;