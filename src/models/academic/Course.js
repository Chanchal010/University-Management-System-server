const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a course title'],
      trim: true,
      maxlength: [100, 'Course title cannot be more than 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Please add a course code'],
      unique: true,
      trim: true,
      maxlength: [20, 'Course code cannot be more than 20 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: true,
    },
    credits: {
      type: Number,
      required: [true, 'Please add credit hours'],
      min: [0.5, 'Credits must be at least 0.5'],
      max: [12, 'Credits cannot exceed 12'],
    },
    level: {
      type: String,
      enum: ['Introductory', 'Intermediate', 'Advanced', 'Graduate'],
      required: true,
    },
    semester: {
      type: String,
      enum: ['Fall', 'Spring', 'Summer', 'Winter', 'Year-round'],
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    corequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    instructors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
      },
    ],
    mainInstructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    schedule: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        startTime: String,
        endTime: String,
        location: String,
      },
    ],
    capacity: {
      type: Number,
      required: [true, 'Please add course capacity'],
      min: [1, 'Capacity must be at least 1'],
    },
    enrolledStudents: {
      type: Number,
      default: 0,
    },
    waitlistCapacity: {
      type: Number,
      default: 0,
    },
    waitlistedStudents: {
      type: Number,
      default: 0,
    },
    syllabus: {
      type: String, // URL to syllabus document
    },
    textbooks: [
      {
        title: String,
        author: String,
        publisher: String,
        year: Number,
        isbn: String,
        required: {
          type: Boolean,
          default: true,
        },
      },
    ],
    assessmentMethods: [
      {
        type: {
          type: String,
          enum: ['Quiz', 'Assignment', 'Project', 'Midterm', 'Final', 'Presentation', 'Participation', 'Other'],
        },
        weight: {
          type: Number,
          min: [0, 'Weight cannot be negative'],
          max: [100, 'Weight cannot exceed 100'],
        },
        description: String,
      },
    ],
    status: {
      type: String,
      enum: ['Active', 'Cancelled', 'Completed', 'Upcoming'],
      default: 'Upcoming',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isHybrid: {
      type: Boolean,
      default: false,
    },
    sections: [
      {
        name: String,
        instructor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Faculty',
        },
        schedule: [
          {
            day: {
              type: String,
              enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            },
            startTime: String,
            endTime: String,
            location: String,
          },
        ],
        capacity: Number,
        enrolledStudents: {
          type: Number,
          default: 0,
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

// Virtual for getting all enrolled students
CourseSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'enrolledCourses.course',
});

// Virtual for getting all attendance records
CourseSchema.virtual('attendanceRecords', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'course',
});

// Virtual for getting all exam results
CourseSchema.virtual('examResults', {
  ref: 'ExamResult',
  localField: '_id',
  foreignField: 'course',
});

// Calculate available seats
CourseSchema.methods.getAvailableSeats = function () {
  return this.capacity - this.enrolledStudents;
};

// Check if course is full
CourseSchema.methods.isFull = function () {
  return this.enrolledStudents >= this.capacity;
};

module.exports = mongoose.model('Course', CourseSchema); 