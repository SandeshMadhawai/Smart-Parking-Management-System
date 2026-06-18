const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingArea',
      required: true,
    },
    slotNumber: {
      type: String,
      required: [true, 'Slot number is required'],
      trim: true,
      uppercase: true, // e.g., "A-1", "B-10"
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available',
    },
    vehicleType: {
      type: String,
      enum: ['car', 'bike', 'truck', 'bus', 'any'],
      default: 'any',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Currently active session reference
    currentSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSession',
      default: null,
    },
    // Physical location info
    position: {
      row: { type: Number, default: 0 },
      column: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: slot number unique per org
parkingSlotSchema.index({ organizationId: 1, slotNumber: 1 }, { unique: true });
parkingSlotSchema.index({ areaId: 1, status: 1 });

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
