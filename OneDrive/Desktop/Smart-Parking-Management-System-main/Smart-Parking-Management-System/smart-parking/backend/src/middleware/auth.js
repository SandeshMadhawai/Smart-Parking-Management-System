const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');
const User = require('../models/User');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Determine if this is an org token or user token
    if (decoded.type === 'organization') {
      const org = await Organization.findById(decoded.id);
      if (!org || !org.isActive) {
        return res.status(401).json({ success: false, message: 'Organization not found or inactive.' });
      }
      req.organization = org;
      req.userType = 'organization';
      req.organizationId = org._id;
    } else if (decoded.type === 'user') {
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'User not found or inactive.' });
      }
      req.user = user;
      req.userType = 'user';
      req.organizationId = user.organizationId;
    } else {
      return res.status(401).json({ success: false, message: 'Invalid token type.' });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    next(error);
  }
};

// Require organization admin role
const requireAdmin = (req, res, next) => {
  if (req.userType === 'organization') return next();
  if (req.userType === 'user' && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required.' });
};

// Require guard or admin
const requireGuard = (req, res, next) => {
  if (req.userType === 'organization') return next();
  if (req.userType === 'user') return next();
  return res.status(403).json({ success: false, message: 'Guard access required.' });
};

module.exports = { protect, requireAdmin, requireGuard };
