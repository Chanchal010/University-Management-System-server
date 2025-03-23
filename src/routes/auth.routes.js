const express = require('express');
const { check } = require('express-validator');
const {
  register,
  login,
  logout,
  getMe,
  updateDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail
} = require('../controllers/auth/index');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Register user
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  register
);

// Login user
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  login
);

// Logout user
router.get('/logout', logout);

// Get current logged in user
router.get('/me', protect, getMe);

// Update user details
router.put(
  '/updatedetails',
  protect,
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
  ],
  updateDetails
);

// Update password
router.put(
  '/updatepassword',
  protect,
  [
    check('currentPassword', 'Current password is required').not().isEmpty(),
    check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  updatePassword
);

// Forgot password
router.post(
  '/forgotpassword',
  [check('email', 'Please include a valid email').isEmail()],
  forgotPassword
);

// Reset password
router.put(
  '/resetpassword/:resettoken',
  [check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })],
  resetPassword
);

// Verify email
router.get('/verify-email/:verificationtoken', verifyEmail);

module.exports = router; 