const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const advancedResults = require('../middleware/advancedResults');
const upload = require('../middleware/fileUpload');
const { validate, admissionValidation } = require('../middleware/validate');

// Import model and controller
const { Admission } = require('../models/admin');
const { admissionController } = require('../controllers/admin');

const {
  getAdmissions,
  getAdmission,
  createAdmission,
  updateAdmission,
  deleteAdmission,
  uploadDocument
} = admissionController;

// Routes
router.use(protect);

// Get all admissions and create admission
router
  .route('/')
  .get(
    advancedResults(Admission),
    authorize('admin', 'faculty'),
    getAdmissions
  )
  .post(
    validate(admissionValidation.createAdmission),
    createAdmission
  );

// Get, update and delete admission
router
  .route('/:id')
  .get(getAdmission)
  .put(
    authorize('admin'),
    validate(admissionValidation.updateAdmission),
    updateAdmission
  )
  .delete(authorize('admin'), deleteAdmission);

// Upload document
router
  .route('/:id/documents')
  .post(
    upload.single('document'),
    uploadDocument
  );

module.exports = router; 