const express = require('express');
const {
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard,
  getAttendanceAnalytics,
  getExamAnalytics,
  getStudentAnalytics,
  getFacultyAnalytics,
  getCourseAnalytics,
} = require('../controllers/analytics');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin dashboard
router.get('/admin-dashboard', authorize('admin', 'superadmin'), getAdminDashboard);

// Faculty dashboard
router.get('/faculty-dashboard', authorize('faculty', 'admin', 'superadmin'), getFacultyDashboard);

// Student dashboard
router.get('/student-dashboard', getStudentDashboard);

// Attendance analytics
router.get('/attendance', getAttendanceAnalytics);

// Exam analytics
router.get('/exams', getExamAnalytics);

module.exports = router; 