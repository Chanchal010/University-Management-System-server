const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { User } = require('../../models/auth');
const asyncHandler = require('../../utils/asyncHandler');
const sendEmail = require('../../utils/sendEmail');


exports.register = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  const { name, email, password, role } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student',
  });

  // Generate email verification token
  const verificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Create verification URL - use the client URL instead of server URL
  const clientDomain = process.env.CLIENT_URL || 'https://university-management-system-server.onrender.com';
  const verificationURL = `${clientDomain}/verify-email/${verificationToken}`;
  
  // Check if it's a Gmail address for special handling
  const isGmailRecipient = email.toLowerCase().endsWith('@gmail.com');

  const htmlMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4285F4; margin: 0;">University Management System</h2>
      </div>
      <h2 style="color: #333; text-align: center; margin-top: 0;">Confirm Your Email Address</h2>
      <p>Hello ${name},</p>
      <p>Thank you for registering with University Management System. Please confirm your email address to complete your registration.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationURL}" style="background-color: #4285F4; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email</a>
      </div>
      <p>Or use this link to verify your email address:</p>
      <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;"><a href="${verificationURL}" style="color: #4285F4; text-decoration: none;">${verificationURL}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <div style="font-size: 12px; color: #777; text-align: center;">
        <p>&copy; ${new Date().getFullYear()} University Management System</p>
        <p>This is an automated message from our registration system.</p>
        <p>For questions, contact <a href="mailto:${process.env.EMAIL_FROM_ADDRESS}" style="color: #4285F4; text-decoration: none;">${process.env.EMAIL_FROM_ADDRESS}</a></p>
      </div>
    </div>
  `;

  try {
    const emailResult = await sendEmail({
      email: user.email,
      subject: 'Confirm your email for University Management System',
      message: `Please confirm your email address by using this link: ${verificationURL}`,
      html: htmlMessage
    });

    if (!emailResult.success) {
      console.error('Email send error:', emailResult.error);
      user.emailVerificationToken = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent, please try again later',
      });
    }

    // Don't send the token in the response for security
    const userData = await User.findById(user._id).select('-password');

    sendTokenResponse(userData, 201, res);
  } catch (err) {
    console.error(err);
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent',
    });
  }
});


exports.login = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});


exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Update user details
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Update password
 * @route   PUT /api/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Password is incorrect',
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'There is no user with that email',
    });
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/auth/resetpassword/${resetToken}`;

  const htmlResetMessage = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4285F4; margin: 0;">University Management System</h2>
      </div>
      <h2 style="color: #333; text-align: center; margin-top: 0;">Password Reset</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password for your University Management System account. To proceed with resetting your password, please click the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4285F4; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset My Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;"><a href="${resetUrl}" style="color: #4285F4; text-decoration: none;">${resetUrl}</a></p>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you did not request a password reset, please disregard this email and ensure your account is secure.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <div style="font-size: 12px; color: #777; text-align: center;">
        <p>&copy; ${new Date().getFullYear()} University Management System. All rights reserved.</p>
        <p>This is an automated message, please do not reply. If you need assistance, please contact support.</p>
        <p><a href="https://university-management-system-server.onrender.com" style="color: #4285F4; text-decoration: none;">University Management System</a></p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset - University Management System',
      message: `You are receiving this email because you requested a password reset. Please click the link below: ${resetUrl}`,
      html: htmlResetMessage
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: 'Email could not be sent',
    });
  }
});

/**
 * @desc    Reset password
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid token',
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Verify email
 * @route   GET /api/auth/verify-email/:verificationtoken
 * @access  Public
 */
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  try {
    // Get hashed token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(req.params.verificationtoken)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    // Set email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    // Return either HTML for browser or JSON for API
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
      // If accessed directly in browser, redirect to frontend
      const clientUrl = process.env.CLIENT_URL || 'https://university-management-system-server.onrender.com';
      return res.redirect(`${clientUrl}/login?verified=true`);
    }

    // API response
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification failed',
    });
  }
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    data: user,
  });
}; 