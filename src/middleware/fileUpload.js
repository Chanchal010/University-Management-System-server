const path = require('path');
const multer = require('multer');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new ErrorResponse(
        'File upload failed. Please upload a valid image or document file.',
        400
      )
    );
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: process.env.MAX_FILE_UPLOAD || 5000000 }, // 5MB default
  fileFilter: fileFilter,
});

module.exports = upload; 