const jwt = require('jsonwebtoken');
const Organization = require('../models/Organization');
const User = require('../models/User');
const VehicleUser = require('../models/VehicleUser');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'organization') {
      const org = await Organization.findById(decoded.id);
      if (!org || !org.isActive) {
        return res.status(401).json({ success: false, message: 'Organization not found' });
      }
      req.organization = org;
      req.userType = 'organization';
      req.organizationId = org._id;
    } else if (decoded.type === 'user') {
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      req.user = user;
      req.userType = 'user';
      req.organizationId = user.organizationId;
    } else if (decoded.type === 'vehicleUser') {
      const vUser = await VehicleUser.findById(decoded.id);
      if (!vUser || !vUser.isActive) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      req.vehicleUser = vUser;
      req.userType = 'vehicleUser';
    } else {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    next(error);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.userType === 'organization') return next();
  if (req.userType === 'user' && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

const requireGuard = (req, res, next) => {
  if (req.userType === 'organization' || req.userType === 'user') return next();
  return res.status(403).json({ success: false, message: 'Guard access required' });
};

const requireVehicleUser = (req, res, next) => {
  if (req.userType === 'vehicleUser') return next();
  return res.status(403).json({ success: false, message: 'Vehicle user access required' });
};

module.exports = { protect, requireAdmin, requireGuard, requireVehicleUser };