const express = require('express');
const { check } = require('express-validator');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadProfileImage,
  uploadDocument,
  verifyDocument,
  deleteDocument,
} = require('../controllers/user');

const { User } = require('../models/auth');
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/fileUpload');

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin only routes
router.use(authorize('admin', 'superadmin'));

// Get all users and create user
router
  .route('/')
  .get(advancedResults(User), getUsers)
  .post(
    [
      check('name', 'Name is required').not().isEmpty(),
      check('email', 'Please include a valid email').isEmail(),
      check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
      check('role', 'Role is required').not().isEmpty(),
    ],
    createUser
  );

// Get, update and delete user
router
  .route('/:id')
  .get(getUser)
  .put(
    [
      check('name', 'Name is required').optional(),
      check('email', 'Please include a valid email').optional().isEmail(),
    ],
    updateUser
  )
  .delete(deleteUser);

// Upload profile image
router.route('/:id/photo').put(upload.single('photo'), uploadProfileImage);

// Upload document
router.route('/:id/documents').post(upload.single('document'), uploadDocument);

// Verify document
router.route('/:id/documents/:documentId/verify').put(verifyDocument);

// Delete document
router.route('/:id/documents/:documentId').delete(deleteDocument);

module.exports = router; 