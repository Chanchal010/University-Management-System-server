const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      required: [true, 'Please add a student ID'],
      unique: true,
      trim: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    graduationDate: {
      type: Date,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
    },
    semester: {
      type: Number,
      min: 1,
      max: 12,
    },
    batch: {
      type: String,
      required: [true, 'Please add a batch'],
    },
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        enrollmentDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['active', 'completed', 'dropped', 'failed'],
          default: 'active',
        },
        grade: {
          type: String,
          enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'I', 'W', ''],
          default: '',
        },
        gradePoints: {
          type: Number,
          min: 0,
          max: 4.0,
          default: 0,
        },
      },
    ],
    academicStatus: {
      type: String,
      enum: ['active', 'probation', 'suspended', 'graduated', 'withdrawn'],
      default: 'active',
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 4.0,
      default: 0,
    },
    totalCreditsEarned: {
      type: Number,
      default: 0,
    },
    attendance: {
      present: {
        type: Number,
        default: 0,
      },
      absent: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    },
    guardian: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
      address: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
      address: String,
    },
    feesStatus: {
      type: String,
      enum: ['paid', 'pending', 'partial', 'waived'],
      default: 'pending',
    },
    scholarships: [
      {
        name: String,
        amount: Number,
        startDate: Date,
        endDate: Date,
        provider: String,
        status: {
          type: String,
          enum: ['active', 'expired', 'revoked'],
          default: 'active',
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting all attendance records
StudentSchema.virtual('attendanceRecords', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'student',
});

// Virtual for getting all exam results
StudentSchema.virtual('examResults', {
  ref: 'ExamResult',
  localField: '_id',
  foreignField: 'student',
});

// Calculate CGPA
StudentSchema.methods.calculateCGPA = function () {
  if (!this.enrolledCourses || this.enrolledCourses.length === 0) {
    return 0;
  }

  const completedCourses = this.enrolledCourses.filter(
    (course) => course.status === 'completed'
  );

  if (completedCourses.length === 0) {
    return 0;
  }

  const totalGradePoints = completedCourses.reduce(
    (sum, course) => sum + course.gradePoints,
    0
  );

  return (totalGradePoints / completedCourses.length).toFixed(2);
};

// Calculate attendance percentage
StudentSchema.methods.calculateAttendancePercentage = function () {
  const total = this.attendance.present + this.attendance.absent;
  if (total === 0) {
    return 0;
  }
  return ((this.attendance.present / total) * 100).toFixed(2);
};

module.exports = mongoose.model('Student', StudentSchema); 