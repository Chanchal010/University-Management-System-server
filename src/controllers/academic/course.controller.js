const { validationResult } = require('express-validator');
const { Course } = require('../../models/academic');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Private
 */
exports.getCourses = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Get single course
 * @route   GET /api/courses/:id
 * @access  Private
 */
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id)
    .populate('department')
    .populate('faculty');
  
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: course
  });
});

/**
 * @desc    Create new course
 * @route   POST /api/courses
 * @access  Private/Admin/Faculty
 */
exports.createCourse = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const course = await Course.create(req.body);
  
  res.status(201).json({
    success: true,
    data: course
  });
});

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private/Admin/Faculty
 */
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);
  
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }
  
  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: course
  });
});

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 * @access  Private/Admin
 */
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }
  
  await course.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Enroll student in course
 * @route   POST /api/courses/:id/enroll
 * @access  Private/Admin/Faculty
 */
exports.enrollStudent = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }
  
  // Check if student is already enrolled
  if (course.students.includes(req.body.studentId)) {
    return next(new ErrorResponse('Student already enrolled in this course', 400));
  }
  
  course.students.push(req.body.studentId);
  await course.save();
  
  res.status(200).json({
    success: true,
    data: course
  });
});

/**
 * @desc    Unenroll student from course
 * @route   DELETE /api/courses/:id/unenroll/:studentId
 * @access  Private/Admin/Faculty
 */
exports.unenrollStudent = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }
  
  // Check if student is enrolled
  if (!course.students.includes(req.params.studentId)) {
    return next(new ErrorResponse('Student not enrolled in this course', 400));
  }
  
  course.students = course.students.filter(
    student => student.toString() !== req.params.studentId
  );
  
  await course.save();
  
  res.status(200).json({
    success: true,
    data: course
  });
});

/**
 * @desc    Get course syllabus
 * @route   GET /api/courses/:id/syllabus
 * @access  Private
 */
exports.getCourseSyllabus = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  if (!course.syllabus) {
    return next(new ErrorResponse(`No syllabus found for this course`, 404));
  }

  res.status(200).json({
    success: true,
    data: course.syllabus
  });
});

/**
 * @desc    Update course syllabus
 * @route   PUT /api/courses/:id/syllabus
 * @access  Private/Admin/Faculty
 */
exports.updateCourseSyllabus = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${req.params.id}`, 404));
  }

  // Check if user is admin or the faculty assigned to the course
  if (
    req.user.role !== 'admin' &&
    req.user.role !== 'superadmin' &&
    course.faculty &&
    course.faculty.toString() !== req.user.id
  ) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course syllabus`, 401));
  }

  // Update syllabus
  course.syllabus = req.body.syllabus;
  course.updatedBy = req.user.id;
  course.lastUpdated = Date.now();

  await course.save();

  res.status(200).json({
    success: true,
    data: course
  });
}); 