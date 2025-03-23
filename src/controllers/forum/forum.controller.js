const { validationResult } = require('express-validator');
const { Forum } = require('../../models/forum');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * @desc    Get all forum topics
 * @route   GET /api/forums
 * @access  Private
 */
exports.getForumTopics = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Get single forum topic
 * @route   GET /api/forums/:id
 * @access  Private
 */
exports.getForumTopic = asyncHandler(async (req, res, next) => {
  const topic = await Forum.findById(req.params.id)
    .populate('createdBy', 'name role profileImage')
    .populate({
      path: 'replies.user',
      select: 'name role profileImage'
    });
  
  if (!topic) {
    return next(new ErrorResponse(`Forum topic not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: topic
  });
});

/**
 * @desc    Create new forum topic
 * @route   POST /api/forums
 * @access  Private
 */
exports.createForumTopic = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  // Add user to req.body
  req.body.createdBy = req.user.id;
  
  const topic = await Forum.create(req.body);
  
  res.status(201).json({
    success: true,
    data: topic
  });
});

/**
 * @desc    Update forum topic
 * @route   PUT /api/forums/:id
 * @access  Private
 */
exports.updateForumTopic = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  let topic = await Forum.findById(req.params.id);
  
  if (!topic) {
    return next(new ErrorResponse(`Forum topic not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is topic creator or admin
  if (
    topic.createdBy.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    req.user.role !== 'superadmin'
  ) {
    return next(new ErrorResponse('Not authorized to update this topic', 401));
  }
  
  topic = await Forum.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: topic
  });
});

/**
 * @desc    Delete forum topic
 * @route   DELETE /api/forums/:id
 * @access  Private
 */
exports.deleteForumTopic = asyncHandler(async (req, res, next) => {
  const topic = await Forum.findById(req.params.id);
  
  if (!topic) {
    return next(new ErrorResponse(`Forum topic not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is topic creator or admin
  if (
    topic.createdBy.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    req.user.role !== 'superadmin'
  ) {
    return next(new ErrorResponse('Not authorized to delete this topic', 401));
  }
  
  await topic.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Add reply to forum topic
 * @route   POST /api/forums/:id/replies
 * @access  Private
 */
exports.addReply = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const topic = await Forum.findById(req.params.id);
  
  if (!topic) {
    return next(new ErrorResponse(`Forum topic not found with id of ${req.params.id}`, 404));
  }
  
  const newReply = {
    user: req.user.id,
    text: req.body.text
  };
  
  topic.replies.push(newReply);
  topic.lastActivity = Date.now();
  
  await topic.save();
  
  // Populate user data in the new reply
  const populatedTopic = await Forum.findById(req.params.id)
    .populate('createdBy', 'name role profileImage')
    .populate({
      path: 'replies.user',
      select: 'name role profileImage'
    });
  
  res.status(200).json({
    success: true,
    data: populatedTopic
  });
});

/**
 * @desc    Delete reply from forum topic
 * @route   DELETE /api/forums/:id/replies/:replyId
 * @access  Private
 */
exports.deleteReply = asyncHandler(async (req, res, next) => {
  const topic = await Forum.findById(req.params.id);
  
  if (!topic) {
    return next(new ErrorResponse(`Forum topic not found with id of ${req.params.id}`, 404));
  }
  
  // Find the reply
  const reply = topic.replies.id(req.params.replyId);
  
  if (!reply) {
    return next(new ErrorResponse('Reply not found', 404));
  }
  
  // Make sure user is reply creator or admin
  if (
    reply.user.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    req.user.role !== 'superadmin'
  ) {
    return next(new ErrorResponse('Not authorized to delete this reply', 401));
  }
  
  // Remove the reply
  reply.deleteOne();
  
  // Update last activity
  topic.lastActivity = Date.now();
  
  await topic.save();
  
  res.status(200).json({
    success: true,
    data: topic
  });
}); 