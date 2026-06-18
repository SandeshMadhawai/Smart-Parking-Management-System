const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @route   GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ organizationId: req.organizationId }).sort('-createdAt');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, assignedGate } = req.body;

    const user = await User.create({
      organizationId: req.organizationId,
      name,
      email,
      password,
      phone,
      role: role || 'guard',
      assignedGate,
    });

    const token = jwt.sign({ id: user._id, type: 'user' }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({ success: true, message: 'User created.', data: user, token });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { name, phone, role, assignedGate, isActive } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { name, phone, role, assignedGate, isActive },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.organizationId },
      { isActive: false }
    );
    res.json({ success: true, message: 'User deactivated.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
