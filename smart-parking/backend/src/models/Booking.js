const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VehicleUser',
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSlot',
      required: true,
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingArea',
      required: true,
    },
    bookingToken: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
    // Vehicle info
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['car', 'bike', 'truck', 'bus'],
      default: 'car',
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    // Timing
    bookingDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationHours: {
      type: Number,
      required: true,
    },
    // Pricing
    pricePerHour: {
      type: Number,
      required: true,
    },
    reservationCharge: {
      type: Number,
      required: true,
    },
    extraHourPrice: {
      type: Number,
      required: true,
    },
    totalEstimated: {
      type: Number,
      required: true,
    },
    // Denormalized
    slotNumber: String,
    areaName: String,
    organizationName: String,
    // Status
    status: {
      type: String,
      enum: ['confirmed', 'active', 'completed', 'cancelled', 'no_show'],
      default: 'confirmed',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    // Linked session (when car actually enters)
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSession',
      default: null,
    },
    actualEntryTime: {
      type: Date,
      default: null,
    },
    actualExitTime: {
      type: Date,
      default: null,
    },
    extraCharges: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ organizationId: 1, status: 1 });
bookingSchema.index({ vehicleNumber: 1, status: 1 });
bookingSchema.index({ slotId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ bookingToken: 1 });

module.exports = mongoose.model('Booking', bookingSchema);