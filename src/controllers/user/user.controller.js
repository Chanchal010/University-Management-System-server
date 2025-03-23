const { validationResult } = require('express-validator');
const { User } = require('../../models/auth');
const { Student, Faculty } = require('../../models/organization');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../utils/asyncHandler');
const upload = require('../../middleware/fileUpload');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Create user
 * @route   POST /api/users
 * @access  Private/Admin
 */
exports.createUser = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Delete associated profiles
  if (user.role === 'student') {
    await Student.findOneAndDelete({ user: user._id });
  } else if (user.role === 'faculty') {
    await Faculty.findOneAndDelete({ user: user._id });
  }

  await user.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @desc    Upload profile image
 * @route   PUT /api/users/:id/photo
 * @access  Private
 */
exports.uploadProfileImage = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Check if user is authorized to update this profile
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this profile`, 401)
    );
  }

  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  // Update user profile image
  user.profileImage = req.file.filename;
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc    Upload user document
 * @route   POST /api/users/:id/documents
 * @access  Private
 */
exports.uploadDocument = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Check if user is authorized to update this profile
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this profile`, 401)
    );
  }

  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }

  // Add document to user
  user.documents.push({
    name: req.body.name || req.file.originalname,
    fileUrl: req.file.filename,
    uploadedAt: Date.now(),
    verified: false,
  });

  await user.save();

  res.status(200).json({
    success: true,
    data: user.documents,
  });
});

/**
 * @desc    Verify user document
 * @route   PUT /api/users/:id/documents/:documentId/verify
 * @access  Private/Admin
 */
exports.verifyDocument = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Find document
  const document = user.documents.id(req.params.documentId);

  if (!document) {
    return next(new ErrorResponse(`Document not found with id of ${req.params.documentId}`, 404));
  }

  // Update document verification status
  document.verified = true;
  await user.save();

  res.status(200).json({
    success: true,
    data: document,
  });
});

/**
 * @desc    Delete user document
 * @route   DELETE /api/users/:id/documents/:documentId
 * @access  Private
 */
exports.deleteDocument = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  // Check if user is authorized to update this profile
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this profile`, 401)
    );
  }

  // Find document
  const document = user.documents.id(req.params.documentId);

  if (!document) {
    return next(new ErrorResponse(`Document not found with id of ${req.params.documentId}`, 404));
  }

  // Remove document
  document.remove();
  await user.save();

  res.status(200).json({
    success: true,
    data: {},
  });
}); 