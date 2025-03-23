const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a timetable title'],
      trim: true,
      maxlength: [100, 'Timetable title cannot be more than 100 characters'],
    },
    academicYear: {
      type: String,
      required: [true, 'Please add academic year'],
    },
    semester: {
      type: String,
      enum: ['Fall', 'Spring', 'Summer', 'Winter'],
      required: [true, 'Please add semester'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Program',
    },
    batch: {
      type: String,
    },
    section: {
      type: String,
    },
    startDate: {
      type: Date,
      required: [true, 'Please add start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please add end date'],
    },
    schedule: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          required: true,
        },
        slots: [
          {
            startTime: {
              type: String,
              required: true,
            },
            endTime: {
              type: String,
              required: true,
            },
            course: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Course',
              required: true,
            },
            faculty: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Faculty',
              required: true,
            },
            location: {
              type: String,
              required: true,
            },
            type: {
              type: String,
              enum: ['Lecture', 'Lab', 'Tutorial', 'Workshop', 'Seminar', 'Other'],
              default: 'Lecture',
            },
          },
        ],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Draft',
    },
    publishedAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
    conflicts: [
      {
        type: {
          type: String,
          enum: ['Faculty', 'Room', 'Course', 'Other'],
        },
        description: String,
        resolved: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to check for scheduling conflicts
TimetableSchema.methods.checkConflicts = function () {
  const conflicts = [];
  const facultySchedule = {};
  const roomSchedule = {};
  const courseSchedule = {};

  // Check for conflicts in each day's schedule
  this.schedule.forEach((day) => {
    day.slots.forEach((slot) => {
      const slotKey = `${day.day}-${slot.startTime}-${slot.endTime}`;
      const facultyId = slot.faculty.toString();
      const roomId = slot.location;
      const courseId = slot.course.toString();

      // Check faculty conflicts
      if (facultySchedule[facultyId] && facultySchedule[facultyId].includes(slotKey)) {
        conflicts.push({
          type: 'Faculty',
          description: `Faculty ${facultyId} is scheduled for multiple classes at ${day.day} ${slot.startTime}-${slot.endTime}`,
        });
      } else {
        facultySchedule[facultyId] = facultySchedule[facultyId] || [];
        facultySchedule[facultyId].push(slotKey);
      }

      // Check room conflicts
      if (roomSchedule[roomId] && roomSchedule[roomId].includes(slotKey)) {
        conflicts.push({
          type: 'Room',
          description: `Room ${roomId} is scheduled for multiple classes at ${day.day} ${slot.startTime}-${slot.endTime}`,
        });
      } else {
        roomSchedule[roomId] = roomSchedule[roomId] || [];
        roomSchedule[roomId].push(slotKey);
      }

      // Check course conflicts
      if (courseSchedule[courseId] && courseSchedule[courseId].includes(slotKey)) {
        conflicts.push({
          type: 'Course',
          description: `Course ${courseId} is scheduled for multiple classes at ${day.day} ${slot.startTime}-${slot.endTime}`,
        });
      } else {
        courseSchedule[courseId] = courseSchedule[courseId] || [];
        courseSchedule[courseId].push(slotKey);
      }
    });
  });

  return conflicts;
};

module.exports = mongoose.model('Timetable', TimetableSchema); 