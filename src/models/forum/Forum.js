const mongoose = require('mongoose');

const ForumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a forum title'],
      trim: true,
      maxlength: [100, 'Forum title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add forum description'],
      maxlength: [500, 'Forum description cannot be more than 500 characters'],
    },
    category: {
      type: String,
      enum: ['General', 'Academic', 'Course-specific', 'Department', 'Student Activities', 'Other'],
      default: 'General',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    accessLevel: {
      type: String,
      enum: ['Public', 'Students', 'Faculty', 'Department', 'Course', 'Specific'],
      default: 'Public',
    },
    allowedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topics: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, 'Topic title cannot be more than 200 characters'],
        },
        content: {
          type: String,
          required: true,
          maxlength: [5000, 'Topic content cannot be more than 5000 characters'],
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
        isPinned: {
          type: Boolean,
          default: false,
        },
        isLocked: {
          type: Boolean,
          default: false,
        },
        attachments: [
          {
            name: String,
            fileUrl: String,
            fileType: String,
            fileSize: Number,
          },
        ],
        views: {
          type: Number,
          default: 0,
        },
        likes: [
          {
            user: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            },
            likedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        replies: [
          {
            content: {
              type: String,
              required: true,
              maxlength: [2000, 'Reply content cannot be more than 2000 characters'],
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
            updatedAt: {
              type: Date,
            },
            attachments: [
              {
                name: String,
                fileUrl: String,
                fileType: String,
                fileSize: Number,
              },
            ],
            likes: [
              {
                user: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'User',
                },
                likedAt: {
                  type: Date,
                  default: Date.now,
                },
              },
            ],
            isDeleted: {
              type: Boolean,
              default: false,
            },
          },
        ],
        tags: [String],
        lastActivity: {
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

// Virtual for getting total topics count
ForumSchema.virtual('topicsCount').get(function () {
  return this.topics.length;
});

// Virtual for getting total replies count
ForumSchema.virtual('repliesCount').get(function () {
  return this.topics.reduce((count, topic) => count + topic.replies.length, 0);
});

// Method to add a new topic
ForumSchema.methods.addTopic = function (topicData) {
  this.topics.push(topicData);
  return this.save();
};

// Method to add a reply to a topic
ForumSchema.methods.addReply = function (topicId, replyData) {
  const topic = this.topics.id(topicId);
  if (!topic) {
    throw new Error('Topic not found');
  }

  if (topic.isLocked) {
    throw new Error('Topic is locked');
  }

  topic.replies.push(replyData);
  topic.lastActivity = new Date();
  return this.save();
};

// Method to like a topic
ForumSchema.methods.likeTopic = function (topicId, userId) {
  const topic = this.topics.id(topicId);
  if (!topic) {
    throw new Error('Topic not found');
  }

  const existingLike = topic.likes.find(
    (like) => like.user.toString() === userId.toString()
  );

  if (existingLike) {
    // Unlike if already liked
    topic.likes = topic.likes.filter(
      (like) => like.user.toString() !== userId.toString()
    );
  } else {
    // Add like
    topic.likes.push({
      user: userId,
      likedAt: new Date(),
    });
  }

  return this.save();
};

module.exports = mongoose.model('Forum', ForumSchema); 