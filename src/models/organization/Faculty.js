const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    facultyId: {
      type: String,
      required: [true, 'Please add a faculty ID'],
      unique: true,
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Please add a designation'],
      enum: [
        'Professor',
        'Associate Professor',
        'Assistant Professor',
        'Lecturer',
        'Adjunct Faculty',
        'Visiting Faculty',
      ],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    specialization: [String],
    qualifications: [
      {
        degree: String,
        institution: String,
        year: Number,
        field: String,
      },
    ],
    joinDate: {
      type: Date,
      default: Date.now,
    },
    employmentStatus: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'visiting', 'retired', 'on-leave'],
      default: 'full-time',
    },
    employmentType: {
      type: String,
      enum: ['permanent', 'temporary', 'contract'],
      default: 'permanent',
    },
    teachingLoad: {
      currentHours: {
        type: Number,
        default: 0,
      },
      maxHours: {
        type: Number,
        default: 40,
      },
    },
    assignedCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        semester: String,
        year: Number,
        section: String,
        status: {
          type: String,
          enum: ['active', 'completed', 'upcoming'],
          default: 'upcoming',
        },
      },
    ],
    publications: [
      {
        title: String,
        journal: String,
        year: Number,
        url: String,
        description: String,
      },
    ],
    research: [
      {
        title: String,
        field: String,
        startDate: Date,
        endDate: Date,
        fundingSource: String,
        amount: Number,
        status: {
          type: String,
          enum: ['ongoing', 'completed', 'proposed'],
          default: 'proposed',
        },
        description: String,
      },
    ],
    awards: [
      {
        title: String,
        year: Number,
        organization: String,
        description: String,
      },
    ],
    officeHours: [
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
    officeLocation: String,
    contactExtension: String,
    attendance: {
      present: {
        type: Number,
        default: 0,
      },
      absent: {
        type: Number,
        default: 0,
      },
      leaves: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting all courses taught
FacultySchema.virtual('coursesTaught', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'instructor',
});

// Calculate attendance percentage
FacultySchema.methods.calculateAttendancePercentage = function () {
  const total = this.attendance.present + this.attendance.absent;
  if (total === 0) {
    return 0;
  }
  return ((this.attendance.present / total) * 100).toFixed(2);
};

module.exports = mongoose.model('Faculty', FacultySchema); 