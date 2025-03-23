const { validationResult } = require('express-validator');
const { Exam, ExamResult } = require('../../models/academic');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * @desc    Get all exams
 * @route   GET /api/exams
 * @access  Private
 */
exports.getExams = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Get single exam
 * @route   GET /api/exams/:id
 * @access  Private
 */
exports.getExam = asyncHandler(async (req, res, next) => {
  const exam = await Exam.findById(req.params.id)
    .populate('course')
    .populate('faculty');
  
  if (!exam) {
    return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: exam
  });
});

/**
 * @desc    Create new exam
 * @route   POST /api/exams
 * @access  Private/Admin/Faculty
 */
exports.createExam = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const exam = await Exam.create(req.body);
  
  res.status(201).json({
    success: true,
    data: exam
  });
});

/**
 * @desc    Update exam
 * @route   PUT /api/exams/:id
 * @access  Private/Admin/Faculty
 */
exports.updateExam = asyncHandler(async (req, res, next) => {
  let exam = await Exam.findById(req.params.id);
  
  if (!exam) {
    return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
  }
  
  exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: exam
  });
});

/**
 * @desc    Delete exam
 * @route   DELETE /api/exams/:id
 * @access  Private/Admin/Faculty
 */
exports.deleteExam = asyncHandler(async (req, res, next) => {
  const exam = await Exam.findById(req.params.id);
  
  if (!exam) {
    return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
  }
  
  // Delete all related exam results
  await ExamResult.deleteMany({ exam: req.params.id });
  
  await exam.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Get exam results
 * @route   GET /api/exams/:id/results
 * @access  Private
 */
exports.getExamResults = asyncHandler(async (req, res, next) => {
  const results = await ExamResult.find({ exam: req.params.id })
    .populate('student')
    .populate('exam');
  
  res.status(200).json({
    success: true,
    count: results.length,
    data: results
  });
});

/**
 * @desc    Add exam result
 * @route   POST /api/exams/:id/results
 * @access  Private/Admin/Faculty
 */
exports.addExamResult = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  // Add exam id to body
  req.body.exam = req.params.id;
  
  // Check if exam exists
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
  }
  
  // Check if result already exists
  const existingResult = await ExamResult.findOne({
    exam: req.params.id,
    student: req.body.student
  });
  
  if (existingResult) {
    return next(new ErrorResponse('Result already exists for this student', 400));
  }
  
  const result = await ExamResult.create(req.body);
  
  res.status(201).json({
    success: true,
    data: result
  });
});

/**
 * @desc    Update exam result
 * @route   PUT /api/exams/:id/results/:resultId
 * @access  Private/Admin/Faculty
 */
exports.updateExamResult = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
  }

  let result = await ExamResult.findById(req.params.resultId);

  if (!result) {
    return next(new ErrorResponse(`Result not found with id of ${req.params.resultId}`, 404));
  }

  // Check if result belongs to the exam
  if (result.exam.toString() !== req.params.id) {
    return next(new ErrorResponse(`Result does not belong to this exam`, 400));
  }

  // Check if user is admin or the faculty assigned to the exam
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'superadmin' &&
    exam.faculty &&
    exam.faculty.toString() !== req.user.id
  ) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update results for this exam`, 401));
  }

  // Check if marks are within the total marks range
  if (req.body.marks && req.body.marks > exam.totalMarks) {
    return next(new ErrorResponse(`Marks cannot exceed total marks of ${exam.totalMarks}`, 400));
  }

  // Update result
  result = await ExamResult.findByIdAndUpdate(req.params.resultId, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * @desc    Delete exam result
 * @route   DELETE /api/exams/:id/results/:resultId
 * @access  Private/Admin/Faculty
 */
exports.deleteExamResult = asyncHandler(async (req, res, next) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return next(new ErrorResponse(`Exam not found with id of ${req.params.id}`, 404));
  }

  const result = await ExamResult.findById(req.params.resultId);

  if (!result) {
    return next(new ErrorResponse(`Result not found with id of ${req.params.resultId}`, 404));
  }

  // Check if result belongs to the exam
  if (result.exam.toString() !== req.params.id) {
    return next(new ErrorResponse(`Result does not belong to this exam`, 400));
  }

  // Check if user is admin or the faculty assigned to the exam
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'superadmin' &&
    exam.faculty &&
    exam.faculty.toString() !== req.user.id
  ) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete results for this exam`, 401));
  }

  await result.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
}); 