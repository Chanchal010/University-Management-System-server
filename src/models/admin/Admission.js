const mongoose = require('mongoose');

const AdmissionSchema = new mongoose.Schema(
  {
    applicant: {
      name: {
        type: String,
        required: [true, 'Please add applicant name'],
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Please add an email'],
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Please add a valid email',
        ],
      },
      phone: {
        type: String,
        required: [true, 'Please add a phone number'],
      },
      dateOfBirth: {
        type: Date,
        required: [true, 'Please add date of birth'],
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: [true, 'Please specify gender'],
      },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
      },
      nationality: String,
      photo: String, // URL to uploaded photo
    },
    applicationNumber: {
      type: String,
      unique: true,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
      required: [true, 'Please select a program'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Please select a department'],
    },
    academicYear: {
      type: String,
      required: [true, 'Please specify academic year'],
    },
    semester: {
      type: String,
      enum: ['Fall', 'Spring', 'Summer', 'Winter'],
      required: [true, 'Please specify semester'],
    },
    educationalBackground: [
      {
        level: {
          type: String,
          enum: ['High School', 'Undergraduate', 'Graduate', 'Other'],
          required: true,
        },
        institution: {
          type: String,
          required: true,
        },
        major: String,
        startDate: Date,
        endDate: Date,
        gpa: Number,
        percentage: Number,
        certificateUrl: String, // URL to uploaded certificate
      },
    ],
    documents: [
      {
        name: {
          type: String,
          required: true,
        },
        documentType: {
          type: String,
          enum: [
            'ID Proof',
            'Academic Certificate',
            'Transcript',
            'Recommendation Letter',
            'Statement of Purpose',
            'Resume/CV',
            'Other',
          ],
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        verified: {
          type: Boolean,
          default: false,
        },
      },
    ],
    applicationStatus: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Under Review',
        'Document Verification',
        'Interview Scheduled',
        'Interview Completed',
        'Approved',
        'Rejected',
        'Waitlisted',
        'Accepted',
        'Cancelled',
      ],
      default: 'Draft',
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            'Draft',
            'Submitted',
            'Under Review',
            'Document Verification',
            'Interview Scheduled',
            'Interview Completed',
            'Approved',
            'Rejected',
            'Waitlisted',
            'Accepted',
            'Cancelled',
          ],
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        remarks: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
    interviewDetails: {
      date: Date,
      time: String,
      location: String,
      interviewers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Faculty',
        },
      ],
      score: Number,
      feedback: String,
      status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No-show'],
      },
    },
    entranceExam: {
      examName: String,
      score: Number,
      percentile: Number,
      examDate: Date,
      certificateUrl: String,
    },
    fees: {
      applicationFee: {
        amount: Number,
        currency: {
          type: String,
          default: 'USD',
        },
        status: {
          type: String,
          enum: ['Pending', 'Paid', 'Waived'],
          default: 'Pending',
        },
        transactionId: String,
        paidAt: Date,
      },
      admissionFee: {
        amount: Number,
        currency: {
          type: String,
          default: 'USD',
        },
        status: {
          type: String,
          enum: ['Pending', 'Paid', 'Waived'],
          default: 'Pending',
        },
        transactionId: String,
        paidAt: Date,
      },
    },
    comments: [
      {
        text: {
          type: String,
          required: true,
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isInternal: {
          type: Boolean,
          default: true,
        },
      },
    ],
    submittedAt: Date,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    },
  },
  {
    timestamps: true,
  }
);

// Generate application number before saving
AdmissionSchema.pre('save', async function (next) {
  if (!this.applicationNumber) {
    const year = new Date().getFullYear().toString().substr(-2);
    const program = await this.model('Program').findById(this.program);
    const programCode = program ? program.code : 'UNK';
    
    // Get count of applications for this program in this year
    const count = await this.constructor.countDocuments({
      program: this.program,
      createdAt: {
        $gte: new Date(`${new Date().getFullYear()}-01-01`),
        $lte: new Date(`${new Date().getFullYear()}-12-31`),
      },
    });
    
    // Generate application number: YEAR-PROGRAM-SEQUENCE
    this.applicationNumber = `${year}${programCode}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Update status history when application status changes
AdmissionSchema.pre('save', function (next) {
  if (this.isModified('applicationStatus')) {
    this.statusHistory.push({
      status: this.applicationStatus,
      date: new Date(),
      remarks: `Status changed to ${this.applicationStatus}`,
    });
  }
  next();
});

module.exports = mongoose.model('Admission', AdmissionSchema); 