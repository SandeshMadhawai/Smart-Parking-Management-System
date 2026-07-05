const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingArea = require('../models/ParkingArea');
const Organization = require('../models/Organization');
const { sendParkingConfirmation } = require('../services/smsService');

// Reserved slot pricing multiplier
const RESERVED_MULTIPLIER = 1.5;

// @route GET /api/bookings/slots-availability
// Get slots available for booking at a given time
const getAvailableSlots = async (req, res, next) => {
  try {
    const { organizationId, startTime, endTime } = req.query;

    if (!organizationId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'organizationId, startTime, endTime are required',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Find slots that have conflicting bookings
    const conflictingBookings = await Booking.find({
      organizationId,
      status: { $in: ['confirmed', 'active'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } },
      ],
    }).select('slotId');

    const bookedSlotIds = conflictingBookings.map(b => b.slotId.toString());

    // Get all active slots
    const allSlots = await ParkingSlot.find({
      organizationId,
      isActive: true,
      status: { $ne: 'maintenance' },
    }).populate('areaId', 'name floor description pricing');

    // Mark which are available
    const slots = allSlots.map(slot => ({
      ...slot.toObject(),
      isBookingAvailable: !bookedSlotIds.includes(slot._id.toString()),
    }));

    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/bookings
// Create a new booking
const createBooking = async (req, res, next) => {
  try {
    const {
      organizationId,
      slotId,
      vehicleNumber,
      vehicleType,
      driverName,
      mobileNumber,
      startTime,
      durationHours,
    } = req.body;

    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationHours * 3600000);

    // Check slot exists
    const slot = await ParkingSlot.findById(slotId).populate('areaId');
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    // Check no conflicting booking
    const conflict = await Booking.findOne({
      slotId,
      status: { $in: ['confirmed', 'active'] },
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already booked for the selected time',
      });
    }

    // Get org pricing
    const org = await Organization.findById(organizationId);
    const area = slot.areaId;

    const basePrice = area.pricing?.basePrice || org.pricing.basePrice;
    const extraHourPrice = area.pricing?.extraHourPrice || org.pricing.extraHourPrice;

    // Reserved slots are 1.5x price
    const pricePerHour = parseFloat(((basePrice / (org.pricing.baseDurationHours || 3)) * RESERVED_MULTIPLIER).toFixed(2));
    const reservationCharge = parseFloat((pricePerHour * durationHours).toFixed(2));
    const totalEstimated = reservationCharge;

    const booking = await Booking.create({
      organizationId,
      userId: req.vehicleUser._id,
      slotId,
      areaId: slot.areaId._id,
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType,
      driverName,
      mobileNumber,
      bookingDate: start,
      startTime: start,
      endTime: end,
      durationHours,
      pricePerHour,
      reservationCharge,
      extraHourPrice: extraHourPrice * RESERVED_MULTIPLIER,
      totalEstimated,
      slotNumber: slot.slotNumber,
      areaName: area.name,
      organizationName: org.name,
    });

    // Send SMS with booking details
    const bookingUrl = `${process.env.QR_BASE_URL}/booking/${booking.bookingToken}`;
    const msg =
      `SpotJet Booking Confirmed!\n` +
      `Slot: ${slot.slotNumber} (Zone ${area.name})\n` +
      `Date: ${start.toLocaleDateString('en-IN')}\n` +
      `Time: ${start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n` +
      `Duration: ${durationHours}h\n` +
      `Amount: Rs.${totalEstimated}\n` +
      `Details: ${bookingUrl}`;

    sendParkingConfirmation({
      mobileNumber,
      driverName,
      slotNumber: slot.slotNumber,
      sessionToken: booking.bookingToken,
      entryTime: start,
      baseUrl: `${process.env.QR_BASE_URL}/booking`,
    }).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Slot booked successfully',
      data: booking,
      bookingUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/bookings/my
// Get current user's bookings
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.vehicleUser._id })
      .sort('-createdAt')
      .limit(20);
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/bookings/check-plate/:vehicleNumber
// Guard checks if incoming car has a booking
const checkPlateBooking = async (req, res, next) => {
  try {
    const { vehicleNumber } = req.params;
    const now = new Date();

    const booking = await Booking.findOne({
      organizationId: req.organizationId,
      vehicleNumber: vehicleNumber.toUpperCase(),
      status: 'confirmed',
      startTime: { $lte: new Date(now.getTime() + 30 * 60000) }, // within 30min window
      endTime: { $gte: now },
    }).populate('slotId', 'slotNumber status');

    if (!booking) {
      return res.json({
        success: true,
        hasBooking: false,
        message: 'No active booking found for this vehicle',
      });
    }

    res.json({
      success: true,
      hasBooking: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/bookings/public/:token
// Public booking details
const getBookingByToken = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ bookingToken: req.params.token });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const org = await Organization.findById(booking.organizationId).select('name upiId');
    res.json({ success: true, data: { ...booking.toObject(), organization: org } });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, userId: req.vehicleUser._id, status: 'confirmed' },
      { status: 'cancelled' },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found or cannot be cancelled' });
    }
    res.json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableSlots,
  createBooking,
  getMyBookings,
  checkPlateBooking,
  getBookingByToken,
  cancelBooking,
};