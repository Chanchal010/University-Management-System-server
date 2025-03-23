const express = require('express');
const { check } = require('express-validator');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const { validate, examValidation } = require('../middleware/validate');

// Import model and controller
const { Exam } = require('../models/academic');
const { examController } = require('../controllers/academic');

const {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  submitExam,
  gradeExam,
  getExamResults,
  addExamResult
} = examController;

// Routes
router.use(protect);

// Get all exams and create exam
router
  .route('/')
  .get(advancedResults(Exam), getExams)
  .post(
    authorize('admin', 'faculty'),
    validate(examValidation.createExam),
    createExam
  );

// Get, update and delete exam
router
  .route('/:id')
  .get(getExam)
  .put(
    authorize('admin', 'faculty'),
    updateExam
  )
  .delete(
    authorize('admin', 'faculty'),
    deleteExam
  );

// Get exam results and add result
router
  .route('/:id/results')
  .get(getExamResults)
  .post(
    authorize('admin', 'faculty'),
    validate(examValidation.addExamResult),
    addExamResult
  );

module.exports = router; 