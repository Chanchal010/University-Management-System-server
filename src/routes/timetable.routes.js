const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const { validate, timetableValidation } = require('../middleware/validate');

// Import models and controller
const { Timetable, Course } = require('../models/academic');
const { timetableController } = require('../controllers/academic');

const {
  getTimetables,
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getStudentTimetable,
  getFacultyTimetable,
  getUserTimetable
} = timetableController;

// Routes
router.use(protect);

// Get all timetables and create timetable
router
  .route('/')
  .get(advancedResults(Timetable), getTimetables)
  .post(
    authorize('admin', 'faculty'),
    validate(timetableValidation.createTimetable),
    createTimetable
  );

// Get, update and delete timetable
router
  .route('/:id')
  .get(getTimetable)
  .put(
    authorize('admin', 'faculty'),
    updateTimetable
  )
  .delete(
    authorize('admin', 'faculty'),
    deleteTimetable
  );

// Get student timetable
router
  .route('/student/:studentId')
  .get(getStudentTimetable);

// Get faculty timetable
router
  .route('/faculty/:facultyId')
  .get(getFacultyTimetable);

module.exports = router; 