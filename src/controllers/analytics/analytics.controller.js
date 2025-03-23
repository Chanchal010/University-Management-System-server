const asyncHandler = require('../../utils/asyncHandler');
const ErrorResponse = require('../../utils/errorResponse');
const { Student, Faculty, Department, Program } = require('../../models/organization');
const { Course, Attendance, Exam, ExamResult } = require('../../models/academic');
const { User } = require('../../models/auth');
const mongoose = require('mongoose');

/**
 * @desc    Get admin dashboard data
 * @route   GET /api/analytics/admin-dashboard
 * @access  Private/Admin
 */
exports.getAdminDashboard = asyncHandler(async (req, res, next) => {
  // Get counts
  const studentCount = await Student.countDocuments();
  const facultyCount = await Faculty.countDocuments();
  const courseCount = await Course.countDocuments();
  const departmentCount = await Department.countDocuments();

  // Get enrollment data by department
  const enrollmentByDepartment = await Student.aggregate([
    {
      $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'departmentInfo',
      },
    },
    {
      $unwind: '$departmentInfo',
    },
    {
      $group: {
        _id: '$departmentInfo._id',
        departmentName: { $first: '$departmentInfo.name' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        department: '$_id',
        departmentName: 1,
        count: 1,
      },
    },
  ]);

  // Get enrollment data by course
  const enrollmentByCourse = await Student.aggregate([
    {
      $unwind: '$enrolledCourses',
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'enrolledCourses.course',
        foreignField: '_id',
        as: 'courseInfo',
      },
    },
    {
      $unwind: '$courseInfo',
    },
    {
      $group: {
        _id: '$courseInfo._id',
        courseName: { $first: '$courseInfo.title' },
        courseCode: { $first: '$courseInfo.code' },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        course: '$_id',
        courseName: 1,
        courseCode: 1,
        count: 1,
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  // Get overall attendance statistics
  const attendanceStats = await Attendance.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
      },
    },
  ]);

  // Calculate total attendance
  const totalAttendance = attendanceStats.reduce((sum, stat) => sum + stat.count, 0);
  
  // Calculate attendance percentages
  const attendancePercentages = attendanceStats.map(stat => ({
    status: stat.status,
    count: stat.count,
    percentage: totalAttendance > 0 ? (stat.count / totalAttendance) * 100 : 0,
  }));

  // Get exam performance statistics
  const examPerformance = await ExamResult.aggregate([
    {
      $group: {
        _id: '$grade',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        grade: '$_id',
        count: 1,
      },
    },
    {
      $sort: { grade: 1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      counts: {
        students: studentCount,
        faculty: facultyCount,
        courses: courseCount,
        departments: departmentCount,
      },
      enrollmentByDepartment,
      enrollmentByCourse,
      attendancePercentages,
      examPerformance,
    },
  });
});

/**
 * @desc    Get faculty dashboard data
 * @route   GET /api/analytics/faculty-dashboard
 * @access  Private/Faculty
 */
exports.getFacultyDashboard = asyncHandler(async (req, res, next) => {
  const facultyId = req.user.id;

  // Get faculty profile
  const faculty = await Faculty.findOne({ user: facultyId }).populate('user', 'name email');

  if (!faculty) {
    return next(new ErrorResponse('Faculty profile not found', 404));
  }

  // Get assigned courses
  const assignedCourses = await Course.find({
    instructors: faculty._id,
  }).select('title code enrolledStudents capacity');

  // Get attendance statistics for faculty's courses
  const attendanceStats = await Attendance.aggregate([
    {
      $match: { faculty: faculty._id },
    },
    {
      $group: {
        _id: {
          course: '$course',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id.course',
        foreignField: '_id',
        as: 'courseInfo',
      },
    },
    {
      $unwind: '$courseInfo',
    },
    {
      $project: {
        _id: 0,
        course: '$_id.course',
        courseName: '$courseInfo.title',
        courseCode: '$courseInfo.code',
        status: '$_id.status',
        count: 1,
      },
    },
    {
      $sort: { courseName: 1, status: 1 },
    },
  ]);

  // Group attendance stats by course
  const courseAttendance = {};
  attendanceStats.forEach(stat => {
    if (!courseAttendance[stat.courseCode]) {
      courseAttendance[stat.courseCode] = {
        courseName: stat.courseName,
        courseCode: stat.courseCode,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      };
    }
    
    courseAttendance[stat.courseCode][stat.status] = stat.count;
    courseAttendance[stat.courseCode].total += stat.count;
  });

  // Calculate attendance percentages
  Object.keys(courseAttendance).forEach(code => {
    const course = courseAttendance[code];
    course.presentPercentage = course.total > 0 ? (course.present / course.total) * 100 : 0;
    course.absentPercentage = course.total > 0 ? (course.absent / course.total) * 100 : 0;
    course.latePercentage = course.total > 0 ? (course.late / course.total) * 100 : 0;
    course.excusedPercentage = course.total > 0 ? (course.excused / course.total) * 100 : 0;
  });

  // Get monthly attendance data
  const monthlyAttendance = await Attendance.aggregate([
    {
      $match: { faculty: faculty._id },
    },
    {
      $project: {
        month: { $month: '$date' },
        year: { $year: '$date' },
        status: 1,
      },
    },
    {
      $group: {
        _id: {
          month: '$month',
          year: '$year',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        year: '$_id.year',
        status: '$_id.status',
        count: 1,
      },
    },
    {
      $sort: { year: 1, month: 1 },
    },
  ]);

  // Get exam statistics
  const examStats = await ExamResult.aggregate([
    {
      $lookup: {
        from: 'exams',
        localField: 'exam',
        foreignField: '_id',
        as: 'examInfo',
      },
    },
    {
      $unwind: '$examInfo',
    },
    {
      $match: { 'examInfo.createdBy': faculty._id },
    },
    {
      $group: {
        _id: {
          course: '$course',
          grade: '$grade',
        },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id.course',
        foreignField: '_id',
        as: 'courseInfo',
      },
    },
    {
      $unwind: '$courseInfo',
    },
    {
      $project: {
        _id: 0,
        course: '$_id.course',
        courseName: '$courseInfo.title',
        courseCode: '$courseInfo.code',
        grade: '$_id.grade',
        count: 1,
      },
    },
    {
      $sort: { courseName: 1, grade: 1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      faculty: {
        name: faculty.user.name,
        email: faculty.user.email,
        facultyId: faculty.facultyId,
        designation: faculty.designation,
      },
      assignedCourses,
      courseAttendance: Object.values(courseAttendance),
      monthlyAttendance,
      examStats,
    },
  });
});

/**
 * @desc    Get student dashboard data
 * @route   GET /api/analytics/student-dashboard
 * @access  Private/Student
 */
exports.getStudentDashboard = asyncHandler(async (req, res, next) => {
  const studentId = req.user.id;

  // Get student profile
  const student = await Student.findOne({ user: studentId })
    .populate('user', 'name email')
    .populate('department', 'name')
    .populate('program', 'name');

  if (!student) {
    return next(new ErrorResponse('Student profile not found', 404));
  }

  // Get enrolled courses
  const enrolledCourses = await Course.find({
    _id: { $in: student.enrolledCourses.map(course => course.course) },
  }).select('title code');

  // Get attendance statistics
  const attendanceStats = await Attendance.aggregate([
    {
      $match: { student: student._id },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
      },
    },
  ]);

  // Calculate total attendance
  const totalAttendance = attendanceStats.reduce((sum, stat) => sum + stat.count, 0);
  
  // Calculate attendance percentages
  const attendancePercentages = attendanceStats.map(stat => ({
    status: stat.status,
    count: stat.count,
    percentage: totalAttendance > 0 ? (stat.count / totalAttendance) * 100 : 0,
  }));

  // Get weekly attendance data
  const weeklyAttendance = await Attendance.aggregate([
    {
      $match: { student: student._id },
    },
    {
      $project: {
        dayOfWeek: { $dayOfWeek: '$date' },
        status: 1,
      },
    },
    {
      $group: {
        _id: {
          dayOfWeek: '$dayOfWeek',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        dayOfWeek: '$_id.dayOfWeek',
        status: '$_id.status',
        count: 1,
      },
    },
    {
      $sort: { dayOfWeek: 1 },
    },
  ]);

  // Get monthly attendance data
  const monthlyAttendance = await Attendance.aggregate([
    {
      $match: { student: student._id },
    },
    {
      $project: {
        month: { $month: '$date' },
        year: { $year: '$date' },
        status: 1,
      },
    },
    {
      $group: {
        _id: {
          month: '$month',
          year: '$year',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        year: '$_id.year',
        status: '$_id.status',
        count: 1,
      },
    },
    {
      $sort: { year: 1, month: 1 },
    },
  ]);

  // Get course-wise attendance
  const courseAttendance = await Attendance.aggregate([
    {
      $match: { student: student._id },
    },
    {
      $group: {
        _id: {
          course: '$course',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id.course',
        foreignField: '_id',
        as: 'courseInfo',
      },
    },
    {
      $unwind: '$courseInfo',
    },
    {
      $project: {
        _id: 0,
        course: '$_id.course',
        courseName: '$courseInfo.title',
        courseCode: '$courseInfo.code',
        status: '$_id.status',
        count: 1,
      },
    },
    {
      $sort: { courseName: 1, status: 1 },
    },
  ]);

  // Get exam results
  const examResults = await ExamResult.find({ student: student._id })
    .populate({
      path: 'exam',
      select: 'title examType totalMarks weightage',
    })
    .populate({
      path: 'course',
      select: 'title code',
    })
    .select('marksObtained percentage grade status');

  res.status(200).json({
    success: true,
    data: {
      student: {
        name: student.user.name,
        email: student.user.email,
        studentId: student.studentId,
        department: student.department ? student.department.name : '',
        program: student.program ? student.program.name : '',
        semester: student.semester,
        cgpa: student.cgpa,
      },
      enrolledCourses,
      attendancePercentages,
      weeklyAttendance,
      monthlyAttendance,
      courseAttendance,
      examResults,
    },
  });
});

/**
 * @desc    Get attendance analytics
 * @route   GET /api/analytics/attendance
 * @access  Private
 */
exports.getAttendanceAnalytics = asyncHandler(async (req, res, next) => {
  const { courseId, departmentId, startDate, endDate } = req.query;

  const match = {};

  if (courseId) {
    match.course = mongoose.Types.ObjectId(courseId);
  }

  if (startDate && endDate) {
    match.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    match.date = { $gte: new Date(startDate) };
  } else if (endDate) {
    match.date = { $lte: new Date(endDate) };
  }

  // Get attendance by status
  const attendanceByStatus = await Attendance.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
      },
    },
  ]);

  // Get attendance by course
  const attendanceByCourse = await Attendance.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: {
          course: '$course',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id.course',
        foreignField: '_id',
        as: 'courseInfo',
      },
    },
    {
      $unwind: '$courseInfo',
    },
    {
      $project: {
        _id: 0,
        course: '$_id.course',
        courseName: '$courseInfo.title',
        courseCode: '$courseInfo.code',
        status: '$_id.status',
        count: 1,
      },
    },
    {
      $sort: { courseName: 1, status: 1 },
    },
  ]);

  // Get attendance by date
  const attendanceByDate = await Attendance.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id.date',
        status: '$_id.status',
        count: 1,
      },
    },
    {
      $sort: { date: 1, status: 1 },
    },
  ]);

  // Get attendance by department if departmentId is provided
  let attendanceByDepartment = [];
  if (departmentId) {
    attendanceByDepartment = await Attendance.aggregate([
      {
        $match: match,
      },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      {
        $unwind: '$studentInfo',
      },
      {
        $match: {
          'studentInfo.department': mongoose.Types.ObjectId(departmentId),
        },
      },
      {
        $group: {
          _id: {
            program: '$studentInfo.program',
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'programs',
          localField: '_id.program',
          foreignField: '_id',
          as: 'programInfo',
        },
      },
      {
        $unwind: '$programInfo',
      },
      {
        $project: {
          _id: 0,
          program: '$_id.program',
          programName: '$programInfo.name',
          status: '$_id.status',
          count: 1,
        },
      },
      {
        $sort: { programName: 1, status: 1 },
      },
    ]);
  }

  res.status(200).json({
    success: true,
    data: {
      attendanceByStatus,
      attendanceByCourse,
      attendanceByDate,
      attendanceByDepartment,
    },
  });
});

/**
 * @desc    Get exam analytics
 * @route   GET /api/analytics/exams
 * @access  Private
 */
exports.getExamAnalytics = asyncHandler(async (req, res, next) => {
  const { courseId, departmentId } = req.query;

  const match = {};

  if (courseId) {
    match.course = mongoose.Types.ObjectId(courseId);
  }

  // Get exam results by grade
  const resultsByGrade = await ExamResult.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: '$grade',
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        grade: '$_id',
        count: 1,
      },
    },
    {
      $sort: { grade: 1 },
    },
  ]);

  // Get exam results by course
  const resultsByCourse = await ExamResult.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: {
          course: '$course',
          status: '$status',
        },
        count: { $sum: 1 },
        avgPercentage: { $avg: '$percentage' },
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id.course',
        foreignField: '_id',
        as: 'courseInfo',
      },
    },
    {
      $unwind: '$courseInfo',
    },
    {
      $project: {
        _id: 0,
        course: '$_id.course',
        courseName: '$courseInfo.title',
        courseCode: '$courseInfo.code',
        status: '$_id.status',
        count: 1,
        avgPercentage: 1,
      },
    },
    {
      $sort: { courseName: 1, status: 1 },
    },
  ]);

  // Get exam results by department if departmentId is provided
  let resultsByDepartment = [];
  if (departmentId) {
    resultsByDepartment = await ExamResult.aggregate([
      {
        $match: match,
      },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      {
        $unwind: '$studentInfo',
      },
      {
        $match: {
          'studentInfo.department': mongoose.Types.ObjectId(departmentId),
        },
      },
      {
        $group: {
          _id: {
            program: '$studentInfo.program',
            status: '$status',
          },
          count: { $sum: 1 },
          avgPercentage: { $avg: '$percentage' },
        },
      },
      {
        $lookup: {
          from: 'programs',
          localField: '_id.program',
          foreignField: '_id',
          as: 'programInfo',
        },
      },
      {
        $unwind: '$programInfo',
      },
      {
        $project: {
          _id: 0,
          program: '$_id.program',
          programName: '$programInfo.name',
          status: '$_id.status',
          count: 1,
          avgPercentage: 1,
        },
      },
      {
        $sort: { programName: 1, status: 1 },
      },
    ]);
  }

  // Get performance distribution
  const performanceDistribution = await ExamResult.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: {
          $cond: [
            { $lt: ['$percentage', 40] },
            'Below 40%',
            {
              $cond: [
                { $lt: ['$percentage', 60] },
                '40% - 60%',
                {
                  $cond: [
                    { $lt: ['$percentage', 80] },
                    '60% - 80%',
                    'Above 80%',
                  ],
                },
              ],
            },
          ],
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        range: '$_id',
        count: 1,
      },
    },
    {
      $sort: {
        range: 1,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      resultsByGrade,
      resultsByCourse,
      resultsByDepartment,
      performanceDistribution,
    },
  });
});

/**
 * @desc    Get enrollment analytics
 * @route   GET /api/analytics/enrollment
 * @access  Private/Admin
 */
exports.getEnrollmentAnalytics = asyncHandler(async (req, res, next) => {
  // Get enrollment by department
  const enrollmentByDepartment = await Student.aggregate([
    {
      $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'departmentInfo',
      },
    },
    {
      $unwind: '$departmentInfo',
    },
    {
      $group: {
        _id: {
          department: '$departmentInfo._id',
          departmentName: '$departmentInfo.name',
          departmentCode: '$departmentInfo.code',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.departmentName': 1 },
    },
  ]);

  // Format enrollment by department
  const departmentData = enrollmentByDepartment.map(item => ({
    departmentId: item._id.department,
    departmentName: item._id.departmentName,
    departmentCode: item._id.departmentCode,
    count: item.count,
  }));

  // Get enrollment by program
  const enrollmentByProgram = await Student.aggregate([
    {
      $lookup: {
        from: 'programs',
        localField: 'program',
        foreignField: '_id',
        as: 'programInfo',
      },
    },
    {
      $unwind: '$programInfo',
    },
    {
      $group: {
        _id: {
          program: '$programInfo._id',
          programName: '$programInfo.name',
          programCode: '$programInfo.code',
          level: '$programInfo.level',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.programName': 1 },
    },
  ]);

  // Format enrollment by program
  const programData = enrollmentByProgram.map(item => ({
    programId: item._id.program,
    programName: item._id.programName,
    programCode: item._id.programCode,
    level: item._id.level,
    count: item.count,
  }));

  // Get enrollment by semester
  const enrollmentBySemester = await Student.aggregate([
    {
      $group: {
        _id: {
          semester: '$semester',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.semester': 1 },
    },
  ]);

  // Format enrollment by semester
  const semesterData = enrollmentBySemester.map(item => ({
    semester: item._id.semester,
    count: item.count,
  }));

  // Get enrollment by batch
  const enrollmentByBatch = await Student.aggregate([
    {
      $group: {
        _id: {
          batch: '$batch',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.batch': 1 },
    },
  ]);

  // Format enrollment by batch
  const batchData = enrollmentByBatch.map(item => ({
    batch: item._id.batch,
    count: item.count,
  }));

  // Get enrollment by academic status
  const enrollmentByStatus = await Student.aggregate([
    {
      $group: {
        _id: {
          status: '$academicStatus',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.status': 1 },
    },
  ]);

  // Format enrollment by academic status
  const statusData = enrollmentByStatus.map(item => ({
    status: item._id.status,
    count: item.count,
  }));

  res.status(200).json({
    success: true,
    data: {
      byDepartment: departmentData,
      byProgram: programData,
      bySemester: semesterData,
      byBatch: batchData,
      byStatus: statusData,
    },
  });
});

/**
 * @desc    Export data to CSV
 * @route   GET /api/analytics/export
 * @access  Private/Admin
 */
exports.exportData = asyncHandler(async (req, res, next) => {
  const { type, format } = req.query;

  if (!type) {
    return next(new ErrorResponse('Please specify the data type to export', 400));
  }

  let data;
  let fields;
  let filename;

  switch (type) {
    case 'students':
      data = await Student.find()
        .populate('user', 'name email')
        .populate('department', 'name')
        .populate('program', 'name');

      data = data.map(student => ({
        studentId: student.studentId,
        name: student.user ? student.user.name : '',
        email: student.user ? student.user.email : '',
        department: student.department ? student.department.name : '',
        program: student.program ? student.program.name : '',
        semester: student.semester,
        batch: student.batch,
        cgpa: student.cgpa,
        academicStatus: student.academicStatus,
        enrollmentDate: student.enrollmentDate,
      }));

      fields = [
        'studentId',
        'name',
        'email',
        'department',
        'program',
        'semester',
        'batch',
        'cgpa',
        'academicStatus',
        'enrollmentDate',
      ];

      filename = 'students-export';
      break;

    case 'faculty':
      data = await Faculty.find()
        .populate('user', 'name email')
        .populate('department', 'name');

      data = data.map(faculty => ({
        facultyId: faculty.facultyId,
        name: faculty.user ? faculty.user.name : '',
        email: faculty.user ? faculty.user.email : '',
        department: faculty.department ? faculty.department.name : '',
        designation: faculty.designation,
        employmentStatus: faculty.employmentStatus,
        employmentType: faculty.employmentType,
        joinDate: faculty.joinDate,
      }));

      fields = [
        'facultyId',
        'name',
        'email',
        'department',
        'designation',
        'employmentStatus',
        'employmentType',
        'joinDate',
      ];

      filename = 'faculty-export';
      break;

    case 'courses':
      data = await Course.find()
        .populate('department', 'name')
        .populate('program', 'name');

      data = data.map(course => ({
        code: course.code,
        title: course.title,
        department: course.department ? course.department.name : '',
        program: course.program ? course.program.name : '',
        credits: course.credits,
        level: course.level,
        semester: course.semester,
        year: course.year,
        capacity: course.capacity,
        enrolledStudents: course.enrolledStudents,
        status: course.status,
      }));

      fields = [
        'code',
        'title',
        'department',
        'program',
        'credits',
        'level',
        'semester',
        'year',
        'capacity',
        'enrolledStudents',
        'status',
      ];

      filename = 'courses-export';
      break;

    case 'attendance':
      data = await Attendance.find()
        .populate({
          path: 'student',
          select: 'studentId',
          populate: {
            path: 'user',
            select: 'name',
          },
        })
        .populate('course', 'code title')
        .populate({
          path: 'faculty',
          select: 'facultyId',
          populate: {
            path: 'user',
            select: 'name',
          },
        });

      data = data.map(attendance => ({
        date: attendance.date,
        studentId: attendance.student ? attendance.student.studentId : '',
        studentName: attendance.student && attendance.student.user ? attendance.student.user.name : '',
        courseCode: attendance.course ? attendance.course.code : '',
        courseTitle: attendance.course ? attendance.course.title : '',
        facultyId: attendance.faculty ? attendance.faculty.facultyId : '',
        facultyName: attendance.faculty && attendance.faculty.user ? attendance.faculty.user.name : '',
        status: attendance.status,
        remarks: attendance.remarks,
      }));

      fields = [
        'date',
        'studentId',
        'studentName',
        'courseCode',
        'courseTitle',
        'facultyId',
        'facultyName',
        'status',
        'remarks',
      ];

      filename = 'attendance-export';
      break;

    case 'exam-results':
      data = await ExamResult.find()
        .populate({
          path: 'student',
          select: 'studentId',
          populate: {
            path: 'user',
            select: 'name',
          },
        })
        .populate('course', 'code title')
        .populate('exam', 'title');

      data = data.map(result => ({
        examTitle: result.exam ? result.exam.title : '',
        studentId: result.student ? result.student.studentId : '',
        studentName: result.student && result.student.user ? result.student.user.name : '',
        courseCode: result.course ? result.course.code : '',
        courseTitle: result.course ? result.course.title : '',
        marksObtained: result.marksObtained,
        percentage: result.percentage,
        grade: result.grade,
        status: result.status,
      }));

      fields = [
        'examTitle',
        'studentId',
        'studentName',
        'courseCode',
        'courseTitle',
        'marksObtained',
        'percentage',
        'grade',
        'status',
      ];

      filename = 'exam-results-export';
      break;

    default:
      return next(new ErrorResponse(`Export type ${type} is not supported`, 400));
  }

  // For now, we'll just return the data as JSON
  // In a real implementation, you would convert to CSV/Excel and send as a file
  res.status(200).json({
    success: true,
    data,
    fields,
    filename,
    format: format || 'json',
  });
}); 