const asyncHandler = require('../../utils/asyncHandler');
const ErrorResponse = require('../../utils/errorResponse');
const { Student, Faculty, Department, Program } = require('../../models/organization');
const { Course, Attendance, Exam, ExamResult } = require('../../models/academic');
const { User } = require('../../models/auth');

/**
 * @desc    Get admin dashboard data
 * @route   GET /api/dashboard/admin
 * @access  Private/Admin
 */
exports.getAdminDashboard = asyncHandler(async (req, res, next) => {
  // Get counts
  const studentCount = await User.countDocuments({ role: 'student' });
  const facultyCount = await User.countDocuments({ role: 'faculty' });
  const courseCount = await Course.countDocuments();
  const departmentCount = await Department.countDocuments();
  const programCount = await Program.countDocuments();

  // Get recent users
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email role createdAt');

  // Get department-wise student distribution
  const departments = await Department.find();
  const departmentData = [];

  for (const department of departments) {
    const studentCountInDepartment = await Student.countDocuments({
      department: department._id,
    });

    departmentData.push({
      department: department.name,
      studentCount: studentCountInDepartment,
    });
  }

  // Get program-wise student distribution
  const programs = await Program.find();
  const programData = [];

  for (const program of programs) {
    const studentCountInProgram = await Student.countDocuments({
      program: program._id,
    });

    programData.push({
      program: program.name,
      studentCount: studentCountInProgram,
    });
  }

  // Get course enrollment statistics
  const courses = await Course.find().sort('-enrolledStudents').limit(10);
  const courseData = courses.map(course => ({
    course: course.title,
    code: course.code,
    enrolledStudents: course.enrolledStudents,
    capacity: course.capacity,
  }));

  // Get overall attendance statistics
  const attendanceStats = await Attendance.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const attendanceData = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  };

  attendanceStats.forEach(stat => {
    attendanceData[stat._id] = stat.count;
  });

  const totalAttendance = Object.values(attendanceData).reduce((a, b) => a + b, 0);
  
  attendanceData.presentPercentage = totalAttendance > 0 
    ? ((attendanceData.present / totalAttendance) * 100).toFixed(2) 
    : 0;

  res.status(200).json({
    success: true,
    data: {
      counts: {
        students: studentCount,
        faculty: facultyCount,
        courses: courseCount,
        departments: departmentCount,
        programs: programCount,
      },
      recentUsers,
      departmentData,
      programData,
      courseData,
      attendanceData,
    },
  });
});

/**
 * @desc    Get faculty dashboard data
 * @route   GET /api/dashboard/faculty
 * @access  Private/Faculty
 */
exports.getFacultyDashboard = asyncHandler(async (req, res, next) => {
  const faculty = await Faculty.findOne({ user: req.user.id }).populate('user');

  if (!faculty) {
    return next(new ErrorResponse('Faculty profile not found', 404));
  }

  // Get assigned courses
  const assignedCourses = await Course.find({
    instructors: faculty._id,
  });

  // Get course IDs
  const courseIds = assignedCourses.map(course => course._id);

  // Get student count in assigned courses
  const studentCount = await Student.countDocuments({
    'enrolledCourses.course': { $in: courseIds },
  });

  // Get attendance statistics for faculty's courses
  const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        course: { $in: courseIds },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const attendanceData = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  };

  attendanceStats.forEach(stat => {
    attendanceData[stat._id] = stat.count;
  });

  const totalAttendance = Object.values(attendanceData).reduce((a, b) => a + b, 0);
  
  attendanceData.presentPercentage = totalAttendance > 0 
    ? ((attendanceData.present / totalAttendance) * 100).toFixed(2) 
    : 0;

  // Get monthly attendance data for charts
  const monthlyAttendance = await Attendance.aggregate([
    {
      $match: {
        course: { $in: courseIds },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          year: { $year: '$date' },
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1,
      },
    },
  ]);

  // Format monthly data for charts
  const monthlyData = [];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  monthlyAttendance.forEach(item => {
    const monthIndex = item._id.month - 1;
    const monthName = months[monthIndex];
    const year = item._id.year;
    const status = item._id.status;
    const count = item.count;

    let monthEntry = monthlyData.find(
      entry => entry.month === monthName && entry.year === year
    );

    if (!monthEntry) {
      monthEntry = {
        month: monthName,
        year,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };
      monthlyData.push(monthEntry);
    }

    monthEntry[status] = count;
  });

  // Get faculty's own attendance
  const facultyAttendance = {
    present: faculty.attendance.present || 0,
    absent: faculty.attendance.absent || 0,
    leaves: faculty.attendance.leaves || 0,
    percentage: faculty.attendance.percentage || 0,
  };

  // Get upcoming exams
  const upcomingExams = await Exam.find({
    course: { $in: courseIds },
    date: { $gte: new Date() },
  })
    .sort('date')
    .limit(5)
    .populate('course', 'title code');

  res.status(200).json({
    success: true,
    data: {
      faculty: {
        name: faculty.user.name,
        email: faculty.user.email,
        facultyId: faculty.facultyId,
        designation: faculty.designation,
        department: faculty.department,
      },
      counts: {
        assignedCourses: assignedCourses.length,
        students: studentCount,
      },
      assignedCourses: assignedCourses.map(course => ({
        id: course._id,
        title: course.title,
        code: course.code,
        enrolledStudents: course.enrolledStudents,
        capacity: course.capacity,
      })),
      attendanceData,
      monthlyData,
      facultyAttendance,
      upcomingExams: upcomingExams.map(exam => ({
        id: exam._id,
        title: exam.title,
        course: exam.course.title,
        courseCode: exam.course.code,
        date: exam.date,
        startTime: exam.startTime,
        endTime: exam.endTime,
      })),
    },
  });
});

/**
 * @desc    Get student dashboard data
 * @route   GET /api/dashboard/student
 * @access  Private/Student
 */
exports.getStudentDashboard = asyncHandler(async (req, res, next) => {
  const student = await Student.findOne({ user: req.user.id })
    .populate('user')
    .populate('department')
    .populate('program')
    .populate('enrolledCourses.course');

  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  // Get course IDs
  const courseIds = student.enrolledCourses.map(
    enrollment => enrollment.course._id
  );

  // Get attendance statistics
  const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        student: student._id,
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const attendanceData = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  };

  attendanceStats.forEach(stat => {
    attendanceData[stat._id] = stat.count;
  });

  const totalAttendance = Object.values(attendanceData).reduce((a, b) => a + b, 0);
  
  attendanceData.presentPercentage = totalAttendance > 0 
    ? ((attendanceData.present / totalAttendance) * 100).toFixed(2) 
    : 0;

  // Get weekly attendance data
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyAttendance = await Attendance.aggregate([
    {
      $match: {
        student: student._id,
        date: { $gte: oneWeekAgo, $lte: today },
      },
    },
    {
      $group: {
        _id: {
          day: { $dayOfWeek: '$date' },
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        '_id.day': 1,
      },
    },
  ]);

  // Format weekly data for charts
  const weeklyData = [];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  weeklyAttendance.forEach(item => {
    const dayIndex = item._id.day - 1;
    const dayName = days[dayIndex];
    const status = item._id.status;
    const count = item.count;

    let dayEntry = weeklyData.find(entry => entry.day === dayName);

    if (!dayEntry) {
      dayEntry = {
        day: dayName,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };
      weeklyData.push(dayEntry);
    }

    dayEntry[status] = count;
  });

  // Get course-wise attendance
  const courseAttendance = [];

  for (const course of student.enrolledCourses) {
    const courseAttendanceStats = await Attendance.aggregate([
      {
        $match: {
          student: student._id,
          course: course.course._id,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const courseAttendanceData = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    courseAttendanceStats.forEach(stat => {
      courseAttendanceData[stat._id] = stat.count;
    });

    const totalCourseAttendance = Object.values(courseAttendanceData).reduce((a, b) => a + b, 0);
    
    courseAttendanceData.presentPercentage = totalCourseAttendance > 0 
      ? ((courseAttendanceData.present / totalCourseAttendance) * 100).toFixed(2) 
      : 0;

    courseAttendance.push({
      course: course.course.title,
      courseCode: course.course.code,
      ...courseAttendanceData,
    });
  }

  // Get upcoming exams
  const upcomingExams = await Exam.find({
    course: { $in: courseIds },
    date: { $gte: new Date() },
  })
    .sort('date')
    .limit(5)
    .populate('course', 'title code');

  // Get recent exam results
  const recentResults = await ExamResult.find({
    student: student._id,
  })
    .sort('-createdAt')
    .limit(5)
    .populate('exam', 'title')
    .populate('course', 'title code');

  res.status(200).json({
    success: true,
    data: {
      student: {
        name: student.user.name,
        email: student.user.email,
        studentId: student.studentId,
        department: student.department ? student.department.name : null,
        program: student.program ? student.program.name : null,
        semester: student.semester,
        batch: student.batch,
        cgpa: student.cgpa,
      },
      enrolledCourses: student.enrolledCourses.map(enrollment => ({
        id: enrollment.course._id,
        title: enrollment.course.title,
        code: enrollment.course.code,
        status: enrollment.status,
        grade: enrollment.grade,
      })),
      attendanceData,
      weeklyData,
      courseAttendance,
      upcomingExams: upcomingExams.map(exam => ({
        id: exam._id,
        title: exam.title,
        course: exam.course.title,
        courseCode: exam.course.code,
        date: exam.date,
        startTime: exam.startTime,
        endTime: exam.endTime,
      })),
      recentResults: recentResults.map(result => ({
        id: result._id,
        exam: result.exam.title,
        course: result.course.title,
        courseCode: result.course.code,
        marksObtained: result.marksObtained,
        percentage: result.percentage,
        grade: result.grade,
        status: result.status,
      })),
    },
  });
});

/**
 * @desc    Get system statistics
 * @route   GET /api/dashboard/stats
 * @access  Private/Admin
 */
exports.getSystemStats = asyncHandler(async (req, res, next) => {
  // Get user statistics
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ active: true });
  const verifiedUsers = await User.countDocuments({ emailVerified: true });

  // Get role distribution
  const roleDistribution = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  // Format role distribution
  const roles = {};
  roleDistribution.forEach(role => {
    roles[role._id] = role.count;
  });

  // Get registration trends (monthly)
  const registrationTrends = await User.aggregate([
    {
      $group: {
        _id: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1,
      },
    },
  ]);

  // Format registration trends
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const registrationData = registrationTrends.map(item => ({
    month: months[item._id.month - 1],
    year: item._id.year,
    count: item.count,
  }));

  res.status(200).json({
    success: true,
    data: {
      userStats: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        roles,
      },
      registrationTrends: registrationData,
    },
  });
}); 