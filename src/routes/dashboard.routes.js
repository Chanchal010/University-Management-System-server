const express = require('express');
const {
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard,
} = require('../controllers/analytics');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin dashboard
router.get('/admin', authorize('admin', 'superadmin'), getAdminDashboard);

// Faculty dashboard
router.get('/faculty', authorize('faculty', 'admin', 'superadmin'), getFacultyDashboard);

// Student dashboard
router.get('/student', getStudentDashboard);

module.exports = router; 