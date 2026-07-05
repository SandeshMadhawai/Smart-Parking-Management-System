const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const vehicleUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    // Saved vehicles
    vehicles: [
      {
        number: { type: String, uppercase: true },
        type: { type: String, enum: ['car', 'bike', 'truck', 'bus'], default: 'car' },
        label: String, // e.g. "My Car", "Office Bike"
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

vehicleUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

vehicleUserSchema.methods.comparePassword = async function (pwd) {
  return bcrypt.compare(pwd, this.password);
};

vehicleUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('VehicleUser', vehicleUserSchema);