const mongoose = require('mongoose');

const parkingAreaSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true,
      uppercase: true, // e.g., "A", "B", "C"
    },
    description: {
      type: String,
      trim: true,
    },
    totalSlots: {
      type: Number,
      default: 0,
    },
    vehicleTypes: {
      type: [String],
      enum: ['car', 'bike', 'truck', 'bus', 'any'],
      default: ['any'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Area-specific pricing (overrides org defaults if set)
    pricing: {
      baseDurationHours: { type: Number, default: null },
      basePrice: { type: Number, default: null },
      extraHourPrice: { type: Number, default: null },
    },
    floor: {
      type: String,
      default: 'Ground',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: area name unique per org
parkingAreaSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ParkingArea', parkingAreaSchema);
