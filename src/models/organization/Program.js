const mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a program name'],
      trim: true,
      maxlength: [100, 'Program name cannot be more than 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Please add a program code'],
      unique: true,
      trim: true,
      maxlength: [10, 'Program code cannot be more than 10 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    level: {
      type: String,
      required: [true, 'Please add a program level'],
      enum: ['Undergraduate', 'Graduate', 'Doctoral', 'Certificate', 'Diploma'],
    },
    duration: {
      years: {
        type: Number,
        required: [true, 'Please add program duration in years'],
        min: [0.5, 'Duration must be at least 0.5 years'],
        max: [10, 'Duration cannot exceed 10 years'],
      },
      semesters: {
        type: Number,
        required: [true, 'Please add program duration in semesters'],
        min: [1, 'Duration must be at least 1 semester'],
        max: [20, 'Duration cannot exceed 20 semesters'],
      },
    },
    totalCredits: {
      type: Number,
      required: [true, 'Please add total credits required'],
      min: [1, 'Total credits must be at least 1'],
    },
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    accreditation: {
      status: {
        type: String,
        enum: ['Accredited', 'Pending', 'Not Accredited', 'Under Review'],
        default: 'Pending',
      },
      body: String,
      validUntil: Date,
    },
    admissionRequirements: [String],
    graduationRequirements: [String],
    careerOpportunities: [String],
    active: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    fees: {
      tuition: {
        amount: Number,
        perCredit: Boolean,
        currency: {
          type: String,
          default: 'USD',
        },
      },
      additional: [
        {
          name: String,
          amount: Number,
          description: String,
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting all courses in this program
ProgramSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'program',
});

// Virtual for getting all students in this program
ProgramSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'program',
});

module.exports = mongoose.model('Program', ProgramSchema); 