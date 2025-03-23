const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const { validate, announcementValidation } = require('../middleware/validate');

// Import model and controller
const { Announcement } = require('../models/admin');
const { announcementController } = require('../controllers/admin');

const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  // ... any other imports ...
} = announcementController;

// Routes
router.use(protect);

// Get all announcements and create announcement
router
  .route('/')
  .get(advancedResults(Announcement), getAnnouncements)
  .post(
    authorize('admin', 'faculty'),
    validate(announcementValidation.createAnnouncement),
    createAnnouncement
  );

// Get, update and delete announcement
router
  .route('/:id')
  .get(getAnnouncement)
  .put(
    validate(announcementValidation.updateAnnouncement),
    updateAnnouncement
  )
  .delete(deleteAnnouncement);

module.exports = router; 