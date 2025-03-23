const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an announcement title'],
      trim: true,
      maxlength: [100, 'Announcement title cannot be more than 100 characters'],
    },
    content: {
      type: String,
      required: [true, 'Please add announcement content'],
      maxlength: [5000, 'Announcement content cannot be more than 5000 characters'],
    },
    category: {
      type: String,
      enum: ['General', 'Academic', 'Admission', 'Exam', 'Event', 'Holiday', 'Emergency', 'Other'],
      default: 'General',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    targetAudience: {
      type: [String],
      enum: ['All', 'Students', 'Faculty', 'Admin', 'Specific'],
      default: ['All'],
    },
    specificTargets: [
      {
        type: {
          type: String,
          enum: ['Department', 'Program', 'Course', 'Batch', 'User'],
        },
        id: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'specificTargets.type',
        },
      },
    ],
    attachments: [
      {
        name: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    publishDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    acknowledgements: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        acknowledgedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual for checking if announcement is active
AnnouncementSchema.virtual('isActive').get(function () {
  const now = new Date();
  return (
    this.isPublished &&
    now >= this.publishDate &&
    (!this.expiryDate || now <= this.expiryDate)
  );
});

// Method to increment view count
AnnouncementSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

// Method to add acknowledgement
AnnouncementSchema.methods.addAcknowledgement = function (userId) {
  // Check if user has already acknowledged
  const existingAck = this.acknowledgements.find(
    (ack) => ack.user.toString() === userId.toString()
  );

  if (!existingAck) {
    this.acknowledgements.push({
      user: userId,
      acknowledgedAt: new Date(),
    });
    return this.save();
  }

  return Promise.resolve(this);
};

module.exports = mongoose.model('Announcement', AnnouncementSchema); 