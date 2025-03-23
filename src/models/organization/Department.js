const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a department name'],
      unique: true,
      trim: true,
      maxlength: [100, 'Department name cannot be more than 100 characters'],
    },
    code: {
      type: String,
      required: [true, 'Please add a department code'],
      unique: true,
      trim: true,
      maxlength: [10, 'Department code cannot be more than 10 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    establishedDate: {
      type: Date,
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    contactEmail: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    contactPhone: {
      type: String,
    },
    location: {
      building: String,
      floor: String,
      roomNumber: String,
    },
    website: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting all programs in this department
DepartmentSchema.virtual('programs', {
  ref: 'Program',
  localField: '_id',
  foreignField: 'department',
});

// Virtual for getting all faculty in this department
DepartmentSchema.virtual('faculty', {
  ref: 'Faculty',
  localField: '_id',
  foreignField: 'department',
});

// Virtual for getting all courses in this department
DepartmentSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'department',
});

module.exports = mongoose.model('Department', DepartmentSchema); 