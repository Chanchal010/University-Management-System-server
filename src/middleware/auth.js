const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const { User } = require('../models/auth');


exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from authorization header or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({ status: 401, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user in request
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ status: 401, message: 'Not authorized to access this route' });
  }
});


exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
}; 