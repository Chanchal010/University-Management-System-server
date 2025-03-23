const { validationResult } = require('express-validator');
const { Admission } = require('../../models/admin');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * @desc    Get all admissions
 * @route   GET /api/admissions
 * @access  Private/Admin
 */
exports.getAdmissions = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Get single admission
 * @route   GET /api/admissions/:id
 * @access  Private
 */
exports.getAdmission = asyncHandler(async (req, res, next) => {
  const admission = await Admission.findById(req.params.id);
  
  if (!admission) {
    return next(new ErrorResponse(`Admission not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: admission
  });
});

/**
 * @desc    Create new admission
 * @route   POST /api/admissions
 * @access  Private
 */
exports.createAdmission = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const admission = await Admission.create(req.body);
  
  res.status(201).json({
    success: true,
    data: admission
  });
});

/**
 * @desc    Update admission
 * @route   PUT /api/admissions/:id
 * @access  Private/Admin
 */
exports.updateAdmission = asyncHandler(async (req, res, next) => {
  let admission = await Admission.findById(req.params.id);
  
  if (!admission) {
    return next(new ErrorResponse(`Admission not found with id of ${req.params.id}`, 404));
  }
  
  admission = await Admission.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: admission
  });
});

/**
 * @desc    Delete admission
 * @route   DELETE /api/admissions/:id
 * @access  Private/Admin
 */
exports.deleteAdmission = asyncHandler(async (req, res, next) => {
  const admission = await Admission.findById(req.params.id);
  
  if (!admission) {
    return next(new ErrorResponse(`Admission not found with id of ${req.params.id}`, 404));
  }
  
  await admission.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Upload admission document
 * @route   POST /api/admissions/:id/documents
 * @access  Private
 */
exports.uploadDocument = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a file', 400));
  }
  
  const admission = await Admission.findById(req.params.id);
  
  if (!admission) {
    return next(new ErrorResponse(`Admission not found with id of ${req.params.id}`, 404));
  }
  
  admission.documents.push({
    name: req.body.name || req.file.originalname,
    fileUrl: req.file.path
  });
  
  await admission.save();
  
  res.status(200).json({
    success: true,
    data: admission
  });
});

/**
 * @desc    Verify admission document
 * @route   PUT /api/admissions/:id/documents/:documentId/verify
 * @access  Private/Admin
 */
exports.verifyDocument = asyncHandler(async (req, res, next) => {
  const admission = await Admission.findById(req.params.id);

  if (!admission) {
    return next(new ErrorResponse(`Admission not found with id of ${req.params.id}`, 404));
  }

  // Find document in admission
  const document = admission.documents.id(req.params.documentId);

  if (!document) {
    return next(new ErrorResponse(`Document not found with id of ${req.params.documentId}`, 404));
  }

  // Update document verification status
  document.verified = true;
  document.verifiedAt = Date.now();
  document.verifiedBy = req.user.id;

  await admission.save();

  res.status(200).json({
    success: true,
    data: admission
  });
});

/**
 * @desc    Delete admission document
 * @route   DELETE /api/admissions/:id/documents/:documentId
 * @access  Private/Admin
 */
exports.deleteDocument = asyncHandler(async (req, res, next) => {
  const admission = await Admission.findById(req.params.id);

  if (!admission) {
    return next(new ErrorResponse(`Admission not found with id of ${req.params.id}`, 404));
  }

  // Find document in admission
  const document = admission.documents.id(req.params.documentId);

  if (!document) {
    return next(new ErrorResponse(`Document not found with id of ${req.params.documentId}`, 404));
  }

  // Check if user is admin or the admission belongs to user
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && 
      admission.user && admission.user.toString() !== req.user.id) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete documents for this admission`, 401));
  }

  // Remove document
  document.deleteOne();
  await admission.save();

  res.status(200).json({
    success: true,
    data: admission
  });
}); 