const { validationResult } = require('express-validator');
const { Announcement } = require('../../models/admin');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * @desc    Get all announcements
 * @route   GET /api/announcements
 * @access  Private
 */
exports.getAnnouncements = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Get single announcement
 * @route   GET /api/announcements/:id
 * @access  Private
 */
exports.getAnnouncement = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id)
    .populate('createdBy', 'name role');
  
  if (!announcement) {
    return next(new ErrorResponse(`Announcement not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: announcement
  });
});

/**
 * @desc    Create new announcement
 * @route   POST /api/announcements
 * @access  Private/Admin/Faculty
 */
exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  // Add user to req.body
  req.body.createdBy = req.user.id;
  
  const announcement = await Announcement.create(req.body);
  
  res.status(201).json({
    success: true,
    data: announcement
  });
});

/**
 * @desc    Update announcement
 * @route   PUT /api/announcements/:id
 * @access  Private
 */
exports.updateAnnouncement = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  let announcement = await Announcement.findById(req.params.id);
  
  if (!announcement) {
    return next(new ErrorResponse(`Announcement not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is announcement creator or admin
  if (
    announcement.createdBy.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    req.user.role !== 'superadmin'
  ) {
    return next(new ErrorResponse('Not authorized to update this announcement', 401));
  }
  
  announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: announcement
  });
});

/**
 * @desc    Delete announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private
 */
exports.deleteAnnouncement = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.findById(req.params.id);
  
  if (!announcement) {
    return next(new ErrorResponse(`Announcement not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is announcement creator or admin
  if (
    announcement.createdBy.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    req.user.role !== 'superadmin'
  ) {
    return next(new ErrorResponse('Not authorized to delete this announcement', 401));
  }
  
  await announcement.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
}); 