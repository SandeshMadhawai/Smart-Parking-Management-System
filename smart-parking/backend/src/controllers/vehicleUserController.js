const jwt = require('jsonwebtoken');
const VehicleUser = require('../models/VehicleUser');

const generateToken = (id) =>
  jwt.sign({ id, type: 'vehicleUser' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// @route POST /api/vehicle-users/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, mobile } = req.body;
    const existing = await VehicleUser.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await VehicleUser.create({ name, email, password, mobile });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, data: user });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/vehicle-users/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await VehicleUser.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = generateToken(user._id);
    res.json({ success: true, token, data: user });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/vehicle-users/me
const getMe = async (req, res) => {
  res.json({ success: true, data: req.vehicleUser });
};

// @route POST /api/vehicle-users/vehicles
// Add a saved vehicle
const addVehicle = async (req, res, next) => {
  try {
    const { number, type, label } = req.body;
    const user = await VehicleUser.findByIdAndUpdate(
      req.vehicleUser._id,
      { $push: { vehicles: { number: number.toUpperCase(), type, label } } },
      { new: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, addVehicle };