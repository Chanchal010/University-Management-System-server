const { check, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // If there are errors, return them
    return res.status(400).json({ status: 400, message: errors.array()[0].msg });
  };
};

// User validation rules
const userValidation = {
  createUser: [
    check('name', 'Name is required').not().isEmpty().trim(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role is required').isIn(['student', 'faculty', 'admin', 'superadmin'])
  ],
  updateUser: [
    check('name', 'Name is required').optional().not().isEmpty().trim(),
    check('email', 'Please include a valid email').optional().isEmail().normalizeEmail()
  ]
};

// Auth validation rules
const authValidation = {
  register: [
    check('name', 'Name is required').not().isEmpty().trim(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  login: [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists()
  ],
  updateDetails: [
    check('name', 'Name is required').not().isEmpty().trim(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail()
  ],
  updatePassword: [
    check('currentPassword', 'Current password is required').not().isEmpty(),
    check('newPassword', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  forgotPassword: [
    check('email', 'Please include a valid email').isEmail().normalizeEmail()
  ],
  resetPassword: [
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ]
};

// Admission validation rules
const admissionValidation = {
  createAdmission: [
    check('applicantName', 'Applicant name is required').not().isEmpty().trim(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('phone', 'Please include a valid phone number').optional().isMobilePhone(),
    check('program', 'Program is required').not().isEmpty(),
    check('dateOfBirth', 'Date of birth must be a valid date').optional().isDate(),
    check('gender', 'Gender must be male, female, or other').optional().isIn(['male', 'female', 'other']),
    check('address.street', 'Street address is required').optional().trim(),
    check('address.city', 'City is required').optional().trim(),
    check('address.state', 'State is required').optional().trim(),
    check('address.zipCode', 'Zip code is required').optional().trim(),
    check('address.country', 'Country is required').optional().trim()
  ],
  updateAdmission: [
    check('applicantName', 'Applicant name is required').optional().not().isEmpty().trim(),
    check('email', 'Please include a valid email').optional().isEmail().normalizeEmail(),
    check('status', 'Status must be pending, reviewing, accepted, or rejected').optional()
      .isIn(['pending', 'reviewing', 'accepted', 'rejected'])
  ]
};

// Course validation rules
const courseValidation = {
  createCourse: [
    check('name', 'Course name is required').not().isEmpty().trim(),
    check('code', 'Course code is required').not().isEmpty().trim(),
    check('description', 'Description is required').optional().trim(),
    check('credits', 'Credits must be a number').isNumeric(),
    check('department', 'Department is required').not().isEmpty(),
    check('faculty', 'Faculty is required').optional(),
    check('capacity', 'Capacity must be a number').optional().isNumeric()
  ],
  updateCourse: [
    check('name', 'Course name is required').optional().not().isEmpty().trim(),
    check('code', 'Course code is required').optional().not().isEmpty().trim(),
    check('credits', 'Credits must be a number').optional().isNumeric(),
    check('status', 'Status must be active, inactive, or archived').optional()
      .isIn(['active', 'inactive', 'archived'])
  ],
  enrollStudent: [
    check('studentId', 'Student ID is required').not().isEmpty()
  ]
};

// Exam validation rules
const examValidation = {
  createExam: [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('course', 'Course is required').not().isEmpty(),
    check('examDate', 'Exam date is required').not().isEmpty(),
    check('totalMarks', 'Total marks are required').isNumeric(),
    check('duration', 'Duration must be a number').optional().isNumeric(),
    check('examType', 'Exam type is required').optional().isIn(['midterm', 'final', 'quiz', 'assignment', 'other'])
  ],
  addExamResult: [
    check('student', 'Student is required').not().isEmpty(),
    check('marks', 'Marks are required').isNumeric()
  ]
};

// Timetable validation rules
const timetableValidation = {
  createTimetable: [
    check('course', 'Course is required').not().isEmpty(),
    check('faculty', 'Faculty is required').not().isEmpty(),
    check('day', 'Day is required').not().isEmpty().isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    check('startTime', 'Start time is required').not().isEmpty(),
    check('endTime', 'End time is required').not().isEmpty(),
    check('room', 'Room is required').not().isEmpty()
  ]
};

// Announcement validation rules
const announcementValidation = {
  createAnnouncement: [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('content', 'Content is required').not().isEmpty(),
    check('audience', 'Audience is required').not().isEmpty().isIn(['all', 'students', 'faculty', 'admin'])
  ],
  updateAnnouncement: [
    check('title', 'Title is required').optional().not().isEmpty().trim(),
    check('content', 'Content is required').optional().not().isEmpty()
  ]
};

// Forum validation rules
const forumValidation = {
  createForumTopic: [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('content', 'Content is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty()
  ],
  updateForumTopic: [
    check('title', 'Title is required').optional().not().isEmpty().trim(),
    check('content', 'Content is required').optional().not().isEmpty()
  ],
  addReply: [
    check('text', 'Reply text is required').not().isEmpty()
  ]
};

module.exports = {
  validate,
  userValidation,
  authValidation,
  admissionValidation,
  courseValidation,
  examValidation,
  timetableValidation,
  announcementValidation,
  forumValidation
}; 