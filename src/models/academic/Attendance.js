const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      required: true,
    },
    remarks: {
      type: String,
      maxlength: [200, 'Remarks cannot be more than 200 characters'],
    },
    lateMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    session: {
      type: String, // e.g., "Lecture", "Lab", "Tutorial"
    },
    duration: {
      type: Number, // Duration in minutes
      min: 0,
    },
    location: {
      type: String,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    verificationMethod: {
      type: String,
      enum: ['manual', 'biometric', 'qr-code', 'rfid', 'other'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a student can only have one attendance record per course per day
AttendanceSchema.index({ course: 1, student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema); 