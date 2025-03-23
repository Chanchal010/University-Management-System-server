const mongoose = require('mongoose');

const ExamResultSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    marksObtained: {
      type: Number,
      required: [true, 'Please add marks obtained'],
      min: [0, 'Marks obtained cannot be negative'],
    },
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'I', 'W'],
    },
    gradePoints: {
      type: Number,
      min: [0, 'Grade points cannot be negative'],
      max: [4.0, 'Grade points cannot exceed 4.0'],
    },
    status: {
      type: String,
      enum: ['Pass', 'Fail', 'Incomplete', 'Withdrawn'],
      required: true,
    },
    feedback: {
      type: String,
    },
    submittedAt: {
      type: Date,
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    evaluatedAt: {
      type: Date,
    },
    sectionWiseMarks: [
      {
        sectionTitle: String,
        marksObtained: Number,
        totalMarks: Number,
        feedback: String,
      },
    ],
    questionWiseMarks: [
      {
        questionNumber: Number,
        marksObtained: Number,
        totalMarks: Number,
        feedback: String,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a student can only have one result per exam
ExamResultSchema.index({ exam: 1, student: 1 }, { unique: true });

// Calculate percentage
ExamResultSchema.pre('save', async function (next) {
  try {
    const exam = await this.model('Exam').findById(this.exam);
    if (exam) {
      this.percentage = ((this.marksObtained / exam.totalMarks) * 100).toFixed(2);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Calculate grade based on percentage
ExamResultSchema.pre('save', function (next) {
  const percentage = this.percentage;

  if (percentage >= 90) {
    this.grade = 'A+';
    this.gradePoints = 4.0;
  } else if (percentage >= 85) {
    this.grade = 'A';
    this.gradePoints = 4.0;
  } else if (percentage >= 80) {
    this.grade = 'A-';
    this.gradePoints = 3.7;
  } else if (percentage >= 75) {
    this.grade = 'B+';
    this.gradePoints = 3.3;
  } else if (percentage >= 70) {
    this.grade = 'B';
    this.gradePoints = 3.0;
  } else if (percentage >= 65) {
    this.grade = 'B-';
    this.gradePoints = 2.7;
  } else if (percentage >= 60) {
    this.grade = 'C+';
    this.gradePoints = 2.3;
  } else if (percentage >= 55) {
    this.grade = 'C';
    this.gradePoints = 2.0;
  } else if (percentage >= 50) {
    this.grade = 'C-';
    this.gradePoints = 1.7;
  } else if (percentage >= 45) {
    this.grade = 'D+';
    this.gradePoints = 1.3;
  } else if (percentage >= 40) {
    this.grade = 'D';
    this.gradePoints = 1.0;
  } else {
    this.grade = 'F';
    this.gradePoints = 0.0;
  }

  next();
});

// Determine pass/fail status
ExamResultSchema.pre('save', async function (next) {
  try {
    const exam = await this.model('Exam').findById(this.exam);
    if (exam && exam.passingMarks) {
      this.status = this.marksObtained >= exam.passingMarks ? 'Pass' : 'Fail';
    } else {
      this.status = this.grade === 'F' ? 'Fail' : 'Pass';
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('ExamResult', ExamResultSchema); 