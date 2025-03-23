const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an exam title'],
      trim: true,
      maxlength: [100, 'Exam title cannot be more than 100 characters'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    examType: {
      type: String,
      enum: ['Quiz', 'Assignment', 'Mid-term', 'Final', 'Project', 'Presentation', 'Other'],
      required: true,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Please add total marks'],
      min: [1, 'Total marks must be at least 1'],
    },
    weightage: {
      type: Number,
      required: [true, 'Please add weightage percentage'],
      min: [0, 'Weightage cannot be negative'],
      max: [100, 'Weightage cannot exceed 100'],
    },
    date: {
      type: Date,
      required: [true, 'Please add exam date'],
    },
    startTime: {
      type: String,
      required: [true, 'Please add start time'],
    },
    endTime: {
      type: String,
      required: [true, 'Please add end time'],
    },
    duration: {
      type: Number, // Duration in minutes
      required: [true, 'Please add duration'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    location: {
      type: String,
    },
    instructions: {
      type: String,
    },
    passingMarks: {
      type: Number,
      min: [0, 'Passing marks cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'],
      default: 'Scheduled',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true,
    },
    sections: [
      {
        title: String,
        description: String,
        marks: Number,
        questions: [
          {
            questionText: String,
            marks: Number,
            questionType: {
              type: String,
              enum: ['Multiple Choice', 'True/False', 'Short Answer', 'Long Answer', 'Numerical', 'Other'],
            },
          },
        ],
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    resultsPublished: {
      type: Boolean,
      default: false,
    },
    resultsPublishedDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting all exam results
ExamSchema.virtual('results', {
  ref: 'ExamResult',
  localField: '_id',
  foreignField: 'exam',
});

module.exports = mongoose.model('Exam', ExamSchema); 