const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const parkingSessionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
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
    // Guard who created the session
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Session unique token (for QR)
    sessionToken: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
    // Vehicle info
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
    },
    driverName: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['car', 'bike', 'truck', 'bus'],
      default: 'car',
    },
    // Timing
    entryTime: {
      type: Date,
      default: Date.now,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    expectedDurationHours: {
      type: Number,
      required: true,
      min: 0.5,
    },
    actualDurationHours: {
      type: Number,
      default: null,
    },
    // Pricing snapshot (at time of entry)
    pricing: {
      baseDurationHours: { type: Number, required: true },
      basePrice: { type: Number, required: true },
      extraHourPrice: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
    },
    // Financial
    baseAmount: {
      type: Number,
      default: 0,
    },
    extraAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    // Denormalized info for quick reads
    slotNumber: String,
    areaName: String,
    organizationName: String,
    // Session state
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'waived'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'cash', 'card', 'waived', null],
      default: null,
    },
    qrCodeDataUrl: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

parkingSessionSchema.index({ organizationId: 1, status: 1 });
parkingSessionSchema.index({ vehicleNumber: 1 });
parkingSessionSchema.index({ createdAt: -1 });

// Virtual: compute live duration in hours
parkingSessionSchema.virtual('liveDurationHours').get(function () {
  const end = this.exitTime || new Date();
  const diffMs = end - this.entryTime;
  return Math.max(0, diffMs / (1000 * 60 * 60));
});

// Method: calculate charges
parkingSessionSchema.methods.calculateCharges = function (exitTime = new Date()) {
  const durationHours = Math.max(0, (exitTime - this.entryTime) / (1000 * 60 * 60));
  const { baseDurationHours, basePrice, extraHourPrice } = this.pricing;

  let baseAmount = basePrice;
  let extraAmount = 0;

  if (durationHours > baseDurationHours) {
    const extraHours = Math.ceil(durationHours - baseDurationHours);
    extraAmount = extraHours * extraHourPrice;
  }

  return {
    durationHours: parseFloat(durationHours.toFixed(2)),
    baseAmount,
    extraAmount,
    totalAmount: baseAmount + extraAmount,
  };
};

module.exports = mongoose.model('ParkingSession', parkingSessionSchema);
