const express = require('express');
const { check } = require('express-validator');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

// Import model and controller
const { Attendance } = require('../models/academic');
const { attendanceController } = require('../controllers/academic');

const {
  getAttendances,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  markAttendance,
  getStudentAttendance,
  getClassAttendance
} = attendanceController;

// Protect all routes
router.use(protect);

// Get attendance statistics
router.route('/stats').get(authorize('admin', 'faculty'), attendanceController.getAttendanceStats);

// Mark bulk attendance
router.route('/bulk').post(
  [
    check('courseId', 'Course ID is required').not().isEmpty(),
    check('date', 'Date is required').not().isEmpty(),
    check('attendanceData', 'Attendance data is required').isArray(),
    check('attendanceData.*.studentId', 'Student ID is required').not().isEmpty(),
    check('attendanceData.*.status', 'Status is required').isIn(['present', 'absent', 'late', 'excused']),
  ],
  authorize('faculty', 'admin'),
  attendanceController.markBulkAttendance
);

// Get attendance by course
router.route('/course/:courseId').get(attendanceController.getAttendanceByCourse);

// Get attendance by student
router.route('/student/:studentId').get(attendanceController.getAttendanceByStudent);

// Get attendance by date
router.route('/date/:date').get(attendanceController.getAttendanceByDate);

// Get all attendances and create attendance
router
  .route('/')
  .get(
    advancedResults(Attendance, [
      { path: 'student', select: 'user', populate: { path: 'user', select: 'name email' } },
      { path: 'course', select: 'title code' },
      { path: 'faculty', select: 'user', populate: { path: 'user', select: 'name email' } },
    ]),
    getAttendances
  )
  .post(
    [
      check('course', 'Course is required').not().isEmpty(),
      check('student', 'Student is required').not().isEmpty(),
      check('faculty', 'Faculty is required').not().isEmpty(),
      check('status', 'Status is required').isIn(['present', 'absent', 'late', 'excused']),
    ],
    authorize('faculty', 'admin'),
    createAttendance
  );

// Get, update and delete attendance
router
  .route('/:id')
  .get(getAttendance)
  .put(
    [check('status', 'Status is required').optional().isIn(['present', 'absent', 'late', 'excused'])],
    authorize('faculty', 'admin'),
    updateAttendance
  )
  .delete(authorize('faculty', 'admin'), deleteAttendance);

module.exports = router; 