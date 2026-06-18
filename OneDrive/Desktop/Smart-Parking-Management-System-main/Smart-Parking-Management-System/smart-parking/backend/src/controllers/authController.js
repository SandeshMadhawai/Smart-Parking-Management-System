const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');
const User = require('../models/User');

const generateToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @route   POST /api/auth/org/register
// @desc    Register a new organization
// @access  Public
const registerOrganization = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, type, upiId } = req.body;

    const existing = await Organization.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const org = await Organization.create({ name, email, password, phone, address, type, upiId });

    const token = generateToken(org._id, 'organization');

    res.status(201).json({
      success: true,
      message: 'Organization registered successfully.',
      token,
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/org/login
// @desc    Login organization
// @access  Public
const loginOrganization = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const org = await Organization.findOne({ email }).select('+password');
    if (!org || !(await org.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!org.isActive) {
      return res.status(401).json({ success: false, message: 'Organization account is disabled.' });
    }

    const token = generateToken(org._id, 'organization');

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/guard/login
// @desc    Login for security guard / staff
// @access  Public
const loginGuard = async (req, res, next) => {
  try {
    const { email, password, organizationId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const query = { email };
    if (organizationId) query.organizationId = organizationId;

    const user = await User.findOne(query).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is disabled.' });
    }

    const token = generateToken(user._id, 'user');

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
// @desc    Get current logged-in user/org
// @access  Private
const getMe = async (req, res) => {
  if (req.userType === 'organization') {
    return res.json({ success: true, data: req.organization, userType: 'organization' });
  }
  res.json({ success: true, data: req.user, userType: 'user' });
};

// @route   PUT /api/auth/org/profile
// @desc    Update organization profile
// @access  Private (org)
const updateOrgProfile = async (req, res, next) => {
  try {
    const { name, phone, address, type, upiId, pricing } = req.body;

    const org = await Organization.findByIdAndUpdate(
      req.organizationId,
      { name, phone, address, type, upiId, pricing },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Profile updated.', data: org });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerOrganization,
  loginOrganization,
  loginGuard,
  getMe,
  updateOrgProfile,
};
