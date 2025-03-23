const express = require('express');
const { check } = require('express-validator');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');

// Import model and controller
const { Course } = require('../models/academic');
const { courseController } = require('../controllers/academic');

const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  unenrollStudent
} = courseController;

// Routes
router.use(protect);

// Get all courses
router
  .route('/')
  .get(advancedResults(Course), getCourses)
  .post(
    authorize('admin', 'faculty'),
    [
      check('name', 'Course name is required').not().isEmpty(),
      check('code', 'Course code is required').not().isEmpty(),
      check('credits', 'Credits are required').isNumeric(),
      check('department', 'Department is required').not().isEmpty()
    ],
    createCourse
  );

// Get, update and delete course
router
  .route('/:id')
  .get(getCourse)
  .put(
    authorize('admin', 'faculty'),
    updateCourse
  )
  .delete(
    authorize('admin'),
    deleteCourse
  );

// Enroll student in course
router
  .route('/:id/enroll')
  .post(
    authorize('admin', 'faculty'),
    [check('studentId', 'Student ID is required').not().isEmpty()],
    enrollStudent
  );

// Unenroll student from course
router
  .route('/:id/unenroll/:studentId')
  .delete(
    authorize('admin', 'faculty'),
    unenrollStudent
  );

module.exports = router; 