const { validationResult } = require('express-validator');
const { Attendance, Course } = require('../../models/academic');
const { Student } = require('../../models/organization');
const ErrorResponse = require('../../utils/errorResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * @desc    Get all attendance records
 * @route   GET /api/attendance
 * @access  Private
 */
exports.getAttendances = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

/**
 * @desc    Get attendance records by course
 * @route   GET /api/attendance/course/:courseId
 * @access  Private
 */
exports.getAttendanceByCourse = asyncHandler(async (req, res, next) => {
  const attendances = await Attendance.find({ course: req.params.courseId })
    .populate({
      path: 'student',
      select: 'user',
      populate: {
        path: 'user',
        select: 'name email',
      },
    })
    .populate({
      path: 'faculty',
      select: 'user',
      populate: {
        path: 'user',
        select: 'name email',
      },
    });

  res.status(200).json({
    success: true,
    count: attendances.length,
    data: attendances,
  });
});

/**
 * @desc    Get attendance records by student
 * @route   GET /api/attendance/student/:studentId
 * @access  Private
 */
exports.getAttendanceByStudent = asyncHandler(async (req, res, next) => {
  const attendances = await Attendance.find({ student: req.params.studentId })
    .populate({
      path: 'course',
      select: 'title code',
    })
    .populate({
      path: 'faculty',
      select: 'user',
      populate: {
        path: 'user',
        select: 'name email',
      },
    });

  res.status(200).json({
    success: true,
    count: attendances.length,
    data: attendances,
  });
});

/**
 * @desc    Get attendance records by date
 * @route   GET /api/attendance/date/:date
 * @access  Private
 */
exports.getAttendanceByDate = asyncHandler(async (req, res, next) => {
  const date = new Date(req.params.date);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const attendances = await Attendance.find({
    date: {
      $gte: date,
      $lt: nextDay,
    },
  })
    .populate({
      path: 'student',
      select: 'user',
      populate: {
        path: 'user',
        select: 'name email',
      },
    })
    .populate({
      path: 'course',
      select: 'title code',
    })
    .populate({
      path: 'faculty',
      select: 'user',
      populate: {
        path: 'user',
        select: 'name email',
      },
    });

  res.status(200).json({
    success: true,
    count: attendances.length,
    data: attendances,
  });
});

/**
 * @desc    Get single attendance record
 * @route   GET /api/attendance/:id
 * @access  Private
 */
exports.getAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id)
    .populate({
      path: 'student',
      select: 'user',
      populate: {
        path: 'user',
        select: 'name email',
      },
    })
    .populate({
      path: 'course',
      select: 'title code',
    })
    .populate({
      path: 'faculty',
      select: 'user',
      populate: {
        path: 'user',
        select: 'name email',
      },
    });

  if (!attendance) {
    return next(
      new ErrorResponse(`Attendance not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

/**
 * @desc    Create attendance record
 * @route   POST /api/attendance
 * @access  Private/Faculty
 */
exports.createAttendance = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  // Add user to req.body
  req.body.markedBy = req.user.id;

  const attendance = await Attendance.create(req.body);

  // Update student attendance stats
  const student = await Student.findById(req.body.student);
  if (student) {
    if (req.body.status === 'present') {
      student.attendance.present += 1;
    } else if (req.body.status === 'absent') {
      student.attendance.absent += 1;
    }

    // Calculate percentage
    student.attendance.percentage = student.calculateAttendancePercentage();
    await student.save();
  }

  res.status(201).json({
    success: true,
    data: attendance,
  });
});

/**
 * @desc    Update attendance record
 * @route   PUT /api/attendance/:id
 * @access  Private/Faculty
 */
exports.updateAttendance = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  let attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return next(
      new ErrorResponse(`Attendance not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is the faculty who marked the attendance or an admin
  if (
    attendance.faculty.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this attendance record`,
        401
      )
    );
  }

  // Update student attendance stats if status is changing
  if (req.body.status && req.body.status !== attendance.status) {
    const student = await Student.findById(attendance.student);
    if (student) {
      // Decrement previous status count
      if (attendance.status === 'present') {
        student.attendance.present -= 1;
      } else if (attendance.status === 'absent') {
        student.attendance.absent -= 1;
      }

      // Increment new status count
      if (req.body.status === 'present') {
        student.attendance.present += 1;
      } else if (req.body.status === 'absent') {
        student.attendance.absent += 1;
      }

      // Calculate percentage
      student.attendance.percentage = student.calculateAttendancePercentage();
      await student.save();
    }
  }

  // Update lastUpdated field
  req.body.lastUpdated = Date.now();

  attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: attendance,
  });
});

/**
 * @desc    Delete attendance record
 * @route   DELETE /api/attendance/:id
 * @access  Private/Faculty
 */
exports.deleteAttendance = asyncHandler(async (req, res, next) => {
  const attendance = await Attendance.findById(req.params.id);

  if (!attendance) {
    return next(
      new ErrorResponse(`Attendance not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is the faculty who marked the attendance or an admin
  if (
    attendance.faculty.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this attendance record`,
        401
      )
    );
  }

  // Update student attendance stats
  const student = await Student.findById(attendance.student);
  if (student) {
    if (attendance.status === 'present') {
      student.attendance.present -= 1;
    } else if (attendance.status === 'absent') {
      student.attendance.absent -= 1;
    }

    // Calculate percentage
    student.attendance.percentage = student.calculateAttendancePercentage();
    await student.save();
  }

  await attendance.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @desc    Mark attendance for multiple students
 * @route   POST /api/attendance/bulk
 * @access  Private/Faculty
 */
exports.markBulkAttendance = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const { courseId, date, attendanceData } = req.body;

  // Validate course
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${courseId}`, 404));
  }

  // Check if user is authorized to mark attendance for this course
  const isInstructor = course.instructors.some(
    (instructor) => instructor.toString() === req.user.id
  );
  if (!isInstructor && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to mark attendance for this course`,
        401
      )
    );
  }

  const attendanceRecords = [];
  const attendanceDate = new Date(date);

  // Process each student's attendance
  for (const data of attendanceData) {
    // Check if attendance record already exists for this student, course, and date
    const existingAttendance = await Attendance.findOne({
      student: data.studentId,
      course: courseId,
      date: {
        $gte: new Date(attendanceDate.setHours(0, 0, 0, 0)),
        $lt: new Date(attendanceDate.setHours(23, 59, 59, 999)),
      },
    });

    if (existingAttendance) {
      // Update existing record
      existingAttendance.status = data.status;
      existingAttendance.remarks = data.remarks || existingAttendance.remarks;
      existingAttendance.lastUpdated = Date.now();
      await existingAttendance.save();
      attendanceRecords.push(existingAttendance);
    } else {
      // Create new record
      const newAttendance = await Attendance.create({
        student: data.studentId,
        course: courseId,
        faculty: req.user.id,
        date: attendanceDate,
        status: data.status,
        remarks: data.remarks,
        markedBy: req.user.id,
      });
      attendanceRecords.push(newAttendance);
    }

    // Update student attendance stats
    const student = await Student.findById(data.studentId);
    if (student) {
      if (data.status === 'present') {
        student.attendance.present += 1;
      } else if (data.status === 'absent') {
        student.attendance.absent += 1;
      }

      // Calculate percentage
      student.attendance.percentage = student.calculateAttendancePercentage();
      await student.save();
    }
  }

  res.status(201).json({
    success: true,
    count: attendanceRecords.length,
    data: attendanceRecords,
  });
});

/**
 * @desc    Get attendance statistics
 * @route   GET /api/attendance/stats
 * @access  Private
 */
exports.getAttendanceStats = asyncHandler(async (req, res, next) => {
  const { courseId, studentId, startDate, endDate } = req.query;

  const query = {};

  if (courseId) {
    query.course = courseId;
  }

  if (studentId) {
    query.student = studentId;
  }

  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    query.date = {
      $gte: new Date(startDate),
    };
  } else if (endDate) {
    query.date = {
      $lte: new Date(endDate),
    };
  }

  // Get attendance records
  const attendances = await Attendance.find(query);

  // Calculate statistics
  const totalRecords = attendances.length;
  const presentCount = attendances.filter(
    (attendance) => attendance.status === 'present'
  ).length;
  const absentCount = attendances.filter(
    (attendance) => attendance.status === 'absent'
  ).length;
  const lateCount = attendances.filter(
    (attendance) => attendance.status === 'late'
  ).length;
  const excusedCount = attendances.filter(
    (attendance) => attendance.status === 'excused'
  ).length;

  const presentPercentage = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;
  const absentPercentage = totalRecords > 0 ? (absentCount / totalRecords) * 100 : 0;
  const latePercentage = totalRecords > 0 ? (lateCount / totalRecords) * 100 : 0;
  const excusedPercentage = totalRecords > 0 ? (excusedCount / totalRecords) * 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      presentPercentage,
      absentPercentage,
      latePercentage,
      excusedPercentage,
    },
  });
}); 