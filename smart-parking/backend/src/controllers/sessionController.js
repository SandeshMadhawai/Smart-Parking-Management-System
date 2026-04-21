const QRCode = require('qrcode');
const ParkingSession = require('../models/ParkingSession');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingArea = require('../models/ParkingArea');
const Organization = require('../models/Organization');
const { sendParkingConfirmation } = require('../services/smsService');

// Helper: Get effective pricing
const getEffectivePricing = (org, area) => {
  return {
    baseDurationHours: area.pricing?.baseDurationHours ?? org.pricing.baseDurationHours,
    basePrice: area.pricing?.basePrice ?? org.pricing.basePrice,
    extraHourPrice: area.pricing?.extraHourPrice ?? org.pricing.extraHourPrice,
    currency: org.pricing.currency,
  };
};

// @route   POST /api/sessions
// @desc    Create new parking session (vehicle entry)
const createSession = async (req, res, next) => {
  try {
    const {
      slotId,
      vehicleNumber,
      driverName,
      mobileNumber,
      vehicleType,
      expectedDurationHours,
      notes,
    } = req.body;

    // Validate slot
    const slot = await ParkingSlot.findOne({
      _id: slotId,
      organizationId: req.organizationId,
      isActive: true,
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }

    if (slot.status !== 'available') {
      return res.status(400).json({ success: false, message: `Slot is currently ${slot.status}.` });
    }

    // Get area and org
    const [area, org] = await Promise.all([
      ParkingArea.findById(slot.areaId),
      Organization.findById(req.organizationId),
    ]);

    const pricing = getEffectivePricing(org, area);

    // Create session
    const session = await ParkingSession.create({
      organizationId: req.organizationId,
      slotId,
      areaId: slot.areaId,
      createdBy: req.user?._id || req.organization?._id,
      vehicleNumber,
      driverName,
      mobileNumber,
      vehicleType: vehicleType || 'car',
      expectedDurationHours,
      pricing,
      baseAmount: pricing.basePrice,
      slotNumber: slot.slotNumber,
      areaName: area.name,
      organizationName: org.name,
      notes,
    });

    // Generate QR code
    const qrUrl = `${process.env.QR_BASE_URL || 'http://localhost:5173/session'}/${session.sessionToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    });

    session.qrCodeDataUrl = qrCodeDataUrl;
    await session.save();

    // Mark slot as occupied
    await ParkingSlot.findByIdAndUpdate(slotId, {
      status: 'occupied',
      currentSessionId: session._id,
    });

    // Send SMS (non-blocking)
    sendParkingConfirmation({
      mobileNumber,
      driverName,
      slotNumber: slot.slotNumber,
      sessionToken: session.sessionToken,
      entryTime: session.entryTime,
      baseUrl: process.env.QR_BASE_URL || 'http://localhost:5173/session',
    }).catch((err) => console.error('SMS error:', err));

    // Emit real-time update
    if (req.io) {
      req.io.to(req.organizationId.toString()).emit('slotUpdated', {
        slotId,
        status: 'occupied',
        sessionId: session._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Parking session started.',
      data: session,
      qrUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/sessions
// @desc    Get all sessions for org (with filters)
const getSessions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, vehicleNumber } = req.query;
    const filter = { organizationId: req.organizationId };

    if (status) filter.status = status;
    if (vehicleNumber) filter.vehicleNumber = { $regex: vehicleNumber, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sessions, total] = await Promise.all([
      ParkingSession.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .populate('slotId', 'slotNumber')
        .populate('createdBy', 'name role'),
      ParkingSession.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/sessions/public/:token
// @desc    Get session by token (no auth - for QR scan)
const getSessionByToken = async (req, res, next) => {
  try {
    const session = await ParkingSession.findOne({ sessionToken: req.params.token });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const org = await Organization.findById(session.organizationId).select('name upiId pricing');

    // Calculate current charges
    const charges = session.calculateCharges();

    res.json({
      success: true,
      data: {
        ...session.toObject(),
        currentCharges: charges,
        organization: org,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/sessions/:id/checkout
// @desc    Complete session (vehicle exit)
const checkoutSession = async (req, res, next) => {
  try {
    const { paymentMethod } = req.body;

    const session = await ParkingSession.findOne({
      _id: req.params.id,
      organizationId: req.organizationId,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Session is already completed.' });
    }

    const exitTime = new Date();
    const charges = session.calculateCharges(exitTime);

    // Update session
    session.exitTime = exitTime;
    session.status = 'completed';
    session.paymentStatus = paymentMethod === 'waived' ? 'waived' : 'paid';
    session.paymentMethod = paymentMethod || 'cash';
    session.actualDurationHours = charges.durationHours;
    session.baseAmount = charges.baseAmount;
    session.extraAmount = charges.extraAmount;
    session.totalAmount = charges.totalAmount;
    await session.save();

    // Free the slot
    await ParkingSlot.findByIdAndUpdate(session.slotId, {
      status: 'available',
      currentSessionId: null,
    });

    // Emit real-time
    if (req.io) {
      req.io.to(session.organizationId.toString()).emit('slotUpdated', {
        slotId: session.slotId,
        status: 'available',
      });
    }

    res.json({ success: true, message: 'Checkout successful.', data: session });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/sessions/public/:token/checkout
// @desc    Public checkout via QR (vehicle owner)
const publicCheckout = async (req, res, next) => {
  try {
    const session = await ParkingSession.findOne({ sessionToken: req.params.token });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Session already completed.' });
    }

    const exitTime = new Date();
    const charges = session.calculateCharges(exitTime);

    session.exitTime = exitTime;
    session.status = 'completed';
    session.paymentStatus = 'paid';
    session.paymentMethod = 'upi';
    session.actualDurationHours = charges.durationHours;
    session.baseAmount = charges.baseAmount;
    session.extraAmount = charges.extraAmount;
    session.totalAmount = charges.totalAmount;
    await session.save();

    await ParkingSlot.findByIdAndUpdate(session.slotId, {
      status: 'available',
      currentSessionId: null,
    });

    const io = req.io;
    if (io) {
      io.to(session.organizationId.toString()).emit('slotUpdated', {
        slotId: session.slotId,
        status: 'available',
      });
    }

    res.json({ success: true, message: 'Payment confirmed. Have a safe journey!', data: session });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/sessions/analytics
// @desc    Analytics data for admin dashboard
const getAnalytics = async (req, res, next) => {
  try {
    const orgId = req.organizationId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalSessions,
      activeSessions,
      todaySessions,
      revenueResult,
      todayRevenueResult,
      totalSlots,
      availableSlots,
    ] = await Promise.all([
      ParkingSession.countDocuments({ organizationId: orgId }),
      ParkingSession.countDocuments({ organizationId: orgId, status: 'active' }),
      ParkingSession.countDocuments({ organizationId: orgId, createdAt: { $gte: today } }),
      ParkingSession.aggregate([
        { $match: { organizationId: orgId, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      ParkingSession.aggregate([
        { $match: { organizationId: orgId, status: 'completed', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      require('../models/ParkingSlot').countDocuments({ organizationId: orgId, isActive: true }),
      require('../models/ParkingSlot').countDocuments({ organizationId: orgId, isActive: true, status: 'available' }),
    ]);

    // Last 7 days revenue
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await ParkingSession.aggregate([
      {
        $match: {
          organizationId: orgId,
          status: 'completed',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        totalSessions,
        activeSessions,
        todaySessions,
        totalRevenue: revenueResult[0]?.total || 0,
        todayRevenue: todayRevenueResult[0]?.total || 0,
        totalSlots,
        availableSlots,
        occupiedSlots: totalSlots - availableSlots,
        occupancyRate: totalSlots > 0 ? (((totalSlots - availableSlots) / totalSlots) * 100).toFixed(1) : 0,
        dailyRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  getSessions,
  getSessionByToken,
  checkoutSession,
  publicCheckout,
  getAnalytics,
};
