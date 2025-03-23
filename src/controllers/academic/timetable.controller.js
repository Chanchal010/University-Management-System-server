const { validationResult } = require('express-validator');
const { Timetable, Course } = require('../../models/academic');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * @desc    Get all timetables
 * @route   GET /api/timetables
 * @access  Private
 */
exports.getTimetables = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Get single timetable
 * @route   GET /api/timetables/:id
 * @access  Private
 */
exports.getTimetable = asyncHandler(async (req, res, next) => {
  const timetable = await Timetable.findById(req.params.id)
    .populate('course')
    .populate('faculty')
    .populate('room');
  
  if (!timetable) {
    return next(new ErrorResponse(`Timetable not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: timetable
  });
});

/**
 * @desc    Create new timetable
 * @route   POST /api/timetables
 * @access  Private/Admin/Faculty
 */
exports.createTimetable = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  // Check for scheduling conflicts
  const { day, startTime, endTime, room } = req.body;
  
  const conflict = await Timetable.findOne({
    day,
    room,
    $or: [
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime }
      },
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime }
      },
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    ]
  });
  
  if (conflict) {
    return next(new ErrorResponse('Scheduling conflict detected for this room and time', 400));
  }
  
  const timetable = await Timetable.create(req.body);
  
  res.status(201).json({
    success: true,
    data: timetable
  });
});

/**
 * @desc    Update timetable
 * @route   PUT /api/timetables/:id
 * @access  Private/Admin/Faculty
 */
exports.updateTimetable = asyncHandler(async (req, res, next) => {
  let timetable = await Timetable.findById(req.params.id);
  
  if (!timetable) {
    return next(new ErrorResponse(`Timetable not found with id of ${req.params.id}`, 404));
  }
  
  // Check for scheduling conflicts if room, day, or time is being updated
  if (req.body.room || req.body.day || req.body.startTime || req.body.endTime) {
    const day = req.body.day || timetable.day;
    const startTime = req.body.startTime || timetable.startTime;
    const endTime = req.body.endTime || timetable.endTime;
    const room = req.body.room || timetable.room;
    
    const conflict = await Timetable.findOne({
      _id: { $ne: req.params.id },
      day,
      room,
      $or: [
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime }
        },
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime }
        },
        {
          startTime: { $gte: startTime },
          endTime: { $lte: endTime }
        }
      ]
    });
    
    if (conflict) {
      return next(new ErrorResponse('Scheduling conflict detected for this room and time', 400));
    }
  }
  
  timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: timetable
  });
});

/**
 * @desc    Delete timetable
 * @route   DELETE /api/timetables/:id
 * @access  Private/Admin/Faculty
 */
exports.deleteTimetable = asyncHandler(async (req, res, next) => {
  const timetable = await Timetable.findById(req.params.id);
  
  if (!timetable) {
    return next(new ErrorResponse(`Timetable not found with id of ${req.params.id}`, 404));
  }
  
  await timetable.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Get student timetable
 * @route   GET /api/timetables/student/:studentId
 * @access  Private
 */
exports.getStudentTimetable = asyncHandler(async (req, res, next) => {
  // Find all courses the student is enrolled in
  const courses = await Course.find({ students: req.params.studentId });
  
  // Get course IDs
  const courseIds = courses.map(course => course._id);
  
  // Find timetable entries for these courses
  const timetable = await Timetable.find({ course: { $in: courseIds } })
    .populate('course')
    .populate('faculty')
    .populate('room')
    .sort({ day: 1, startTime: 1 });
  
  res.status(200).json({
    success: true,
    count: timetable.length,
    data: timetable
  });
});

/**
 * @desc    Get faculty timetable
 * @route   GET /api/timetables/faculty/:facultyId
 * @access  Private
 */
exports.getFacultyTimetable = asyncHandler(async (req, res, next) => {
  // Find timetable entries for this faculty
  const timetable = await Timetable.find({ faculty: req.params.facultyId })
    .populate('course')
    .populate('room')
    .sort({ day: 1, startTime: 1 });
  
  res.status(200).json({
    success: true,
    count: timetable.length,
    data: timetable
  });
}); 