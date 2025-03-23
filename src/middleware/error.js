const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = res.status(404).json({ status: 404, message: message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value: ${field} with value: ${value}. Please use another value.`;
    error = res.status(400).json({ status: 400, message: message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = res.status(400).json({ status: 400, message: message });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = res.status(401).json({ status: 401, message: message });
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please log in again.';
    error = res.status(401).json({ status: 401, message: message });
  }

  // Multer file size limit
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = `File size exceeds the limit of ${process.env.MAX_FILE_UPLOAD} bytes`;
    error = res.status(400).json({ status: 400, message: message });
  }

  // Express validator errors
  if (err.array && typeof err.array === 'function') {
    const message = err.array().map(error => error.msg);
    error = res.status(400).json({ status: 400, message: message });
  }

  // Default error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler; 