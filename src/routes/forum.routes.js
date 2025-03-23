const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const { validate, forumValidation } = require('../middleware/validate');

// Import model and controller
const { Forum } = require('../models/forum');
const {
  getForumTopics,
  getForumTopic,
  createForumTopic,
  updateForumTopic,
  deleteForumTopic,
  addReply,
  deleteReply
} = require('../controllers/forum');

// Routes
router.use(protect);

// Get all forum topics and create topic
router
  .route('/')
  .get(advancedResults(Forum), getForumTopics)
  .post(
    validate(forumValidation.createForumTopic),
    createForumTopic
  );

// Get, update and delete forum topic
router
  .route('/:id')
  .get(getForumTopic)
  .put(
    validate(forumValidation.updateForumTopic),
    updateForumTopic
  )
  .delete(deleteForumTopic);

// Add reply to forum topic
router
  .route('/:id/replies')
  .post(
    validate(forumValidation.addReply),
    addReply
  );

// Delete reply from forum topic
router
  .route('/:id/replies/:replyId')
  .delete(deleteReply);

module.exports = router; 