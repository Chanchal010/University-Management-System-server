const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const RateLimiterFlexible = require('rate-limiter-flexible');
const colors = require('colors');

// Import routes
const userRoutes = require('./src/routes/user.routes');
const authRoutes = require('./src/routes/auth.routes');
const courseRoutes = require('./src/routes/course.routes');
const subjectRoutes = require('./src/routes/dashboard.routes');
const enrollmentRoutes = require('./src/routes/dashboard.routes');
const studentRoutes = require('./src/routes/dashboard.routes');
const facultyRoutes = require('./src/routes/dashboard.routes');
const admissionRoutes = require('./src/routes/admission.routes');
const attendanceRoutes = require('./src/routes/attendance.routes');
const examRoutes = require('./src/routes/exam.routes');
const timetableRoutes = require('./src/routes/timetable.routes');
const announcementRoutes = require('./src/routes/announcement.routes');
const forumRoutes = require('./src/routes/forum.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');

// Initialize Express app
const app = express();

// Custom Morgan token for colorized status codes
morgan.token('statusColor', (req, res) => {
  const status = res.statusCode;
  let color = 'green';
  
  if (status >= 400 && status < 500) {
    color = 'yellow';
  } else if (status >= 500) {
    color = 'red';
  }
  
  return colors[color](status);
});

// Custom Morgan format
const morganFormat = ':method :url :statusColor :response-time ms - :res[content-length]';

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(cors());
app.use(helmet());
app.use(morgan(morganFormat));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Root homepage
app.get('/', (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>University Management System</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: 'Inter', sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f7fa;
      }
      .hero {
        background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
        color: white;
        padding: 100px 20px;
        text-align: center;
      }
      .hero h1 {
        font-size: 48px;
        margin-bottom: 20px;
        letter-spacing: -1px;
      }
      .hero p {
        font-size: 20px;
        max-width: 800px;
        margin: 0 auto 30px;
        opacity: 0.9;
      }
      .btn {
        display: inline-block;
        background-color: #fff;
        color: #4b6cb7;
        padding: 12px 24px;
        border-radius: 30px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 80px 20px;
      }
      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 40px;
        margin-top: 40px;
      }
      .feature {
        background-color: #fff;
        border-radius: 10px;
        padding: 30px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        transition: transform 0.3s, box-shadow 0.3s;
        text-align: center;
      }
      .feature:hover {
        transform: translateY(-10px);
        box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
      }
      .feature-icon {
        font-size: 40px;
        margin-bottom: 20px;
        color: #4b6cb7;
      }
      .feature h3 {
        font-size: 22px;
        margin-bottom: 15px;
        color: #182848;
      }
      .section-title {
        text-align: center;
        margin-bottom: 60px;
      }
      .section-title h2 {
        font-size: 36px;
        color: #182848;
        margin-bottom: 15px;
      }
      .section-title p {
        font-size: 18px;
        color: #666;
        max-width: 700px;
        margin: 0 auto;
      }
      .cta {
        background-color: #182848;
        color: white;
        text-align: center;
        padding: 80px 20px;
      }
      .cta h2 {
        font-size: 36px;
        margin-bottom: 20px;
      }
      .cta p {
        font-size: 18px;
        max-width: 700px;
        margin: 0 auto 30px;
        opacity: 0.9;
      }
      .cta .btn {
        background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
        color: white;
        border: 2px solid white;
      }
      .footer {
        background-color: #f8f9fa;
        padding: 40px 20px;
        text-align: center;
        color: #666;
      }
      @media (max-width: 768px) {
        .hero h1 {
          font-size: 36px;
        }
        .hero p {
          font-size: 18px;
        }
        .container {
          padding: 60px 20px;
        }
        .section-title h2 {
          font-size: 30px;
        }
      }
    </style>
  </head>
  <body>
    <section class="hero">
      <h1>University Management System</h1>
      <p>A comprehensive platform for managing university operations, courses, students, faculty, and more</p>
      <a href="/api" class="btn">Explore API Documentation</a>
    </section>

    <div class="container">
      <div class="section-title">
        <h2>Key Features</h2>
        <p>Our platform provides a wide range of features to streamline university management</p>
      </div>
      <div class="features">
        <div class="feature">
          <div class="feature-icon">👨‍🎓</div>
          <h3>Student Management</h3>
          <p>Efficiently manage student profiles, enrollments, attendance, and academic records</p>
        </div>
        <div class="feature">
          <div class="feature-icon">👨‍🏫</div>
          <h3>Faculty Portal</h3>
          <p>Track faculty assignments, attendance management, and subject teaching</p>
        </div>
        <div class="feature">
          <div class="feature-icon">📚</div>
          <h3>Course Management</h3>
          <p>Create and manage courses, subjects, and their relationships</p>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <h3>Analytics & Reporting</h3>
          <p>Generate detailed reports and visualize data for better decision making</p>
        </div>
        <div class="feature">
          <div class="feature-icon">📝</div>
          <h3>Attendance Tracking</h3>
          <p>Record and monitor student attendance with detailed reporting</p>
        </div>
        <div class="feature">
          <div class="feature-icon">📣</div>
          <h3>Announcements</h3>
          <p>Create and distribute announcements to students and faculty</p>
        </div>
      </div>
    </div>

    <section class="cta">
      <h2>Ready to Get Started?</h2>
      <p>Explore our comprehensive API documentation to learn how to integrate with the University Management System</p>
      <a href="/api" class="btn">View API Documentation</a>
    </section>

    <footer class="footer">
      <p>© ${new Date().getFullYear()} University Management System - All Rights Reserved</p>
    </footer>
  </body>
  </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
});

// Rate limiting
const limiter = new RateLimiterFlexible.RateLimiterMemory({
  points: 100, // Number of points
  duration: 60, // Per 60 seconds
});

// Rate limiting middleware
app.use((req, res, next) => {
  limiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.'
      });
    });
});

// API Welcome Route
app.get('/api', (req, res) => {
  // Check if client wants JSON
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(200).json({
      success: true,
      message: 'Welcome to University Management System API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        courses: '/api/courses',
        subjects: '/api/subjects',
        students: '/api/students',
        faculty: '/api/faculty',
        enrollments: '/api/enrollments',
        attendance: '/api/attendance',
        analytics: '/api/analytics'
      }
    });
  }

  // Send HTML response
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>University Management System API</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: 'Inter', sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f7fa;
        padding: 20px;
      }
      .container {
        max-width: 1000px;
        margin: 0 auto;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      header {
        background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
        color: white;
        padding: 30px;
        text-align: center;
      }
      header h1 {
        margin-bottom: 10px;
        font-size: 28px;
      }
      header p {
        font-size: 16px;
        opacity: 0.9;
      }
      .version {
        display: inline-block;
        background-color: rgba(255, 255, 255, 0.2);
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 14px;
        margin-top: 10px;
      }
      .content {
        padding: 30px;
      }
      .endpoints {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      .endpoint {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .endpoint:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
      }
      .endpoint h3 {
        font-size: 18px;
        margin-bottom: 10px;
        color: #4b6cb7;
      }
      .endpoint p {
        color: #666;
        margin-bottom: 15px;
      }
      .endpoint-url {
        display: block;
        background-color: #182848;
        color: white;
        padding: 8px 12px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 14px;
        word-break: break-all;
      }
      .footer {
        text-align: center;
        padding: 20px;
        border-top: 1px solid #eee;
        color: #666;
        font-size: 14px;
      }
      @media (max-width: 768px) {
        .endpoints {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>University Management System API</h1>
        <p>A comprehensive API for university management with authentication, courses, students, and more</p>
        <span class="version">Version 1.0.0</span>
      </header>
      <div class="content">
        <h2>Available Endpoints</h2>
        <div class="endpoints">
          <div class="endpoint">
            <h3>Authentication</h3>
            <p>User registration, login, and logout endpoints</p>
            <span class="endpoint-url">/api/auth</span>
          </div>
          <div class="endpoint">
            <h3>Users</h3>
            <p>User management endpoints for admins</p>
            <span class="endpoint-url">/api/users</span>
          </div>
          <div class="endpoint">
            <h3>Courses</h3>
            <p>Create, update, delete, and list all courses</p>
            <span class="endpoint-url">/api/courses</span>
          </div>
          <div class="endpoint">
            <h3>Subjects</h3>
            <p>Subject management with course association</p>
            <span class="endpoint-url">/api/subjects</span>
          </div>
          <div class="endpoint">
            <h3>Students</h3>
            <p>Student profile and academic information</p>
            <span class="endpoint-url">/api/students</span>
          </div>
          <div class="endpoint">
            <h3>Faculty</h3>
            <p>Faculty member profiles and assignments</p>
            <span class="endpoint-url">/api/faculty</span>
          </div>
          <div class="endpoint">
            <h3>Enrollments</h3>
            <p>Student enrollment in subjects and courses</p>
            <span class="endpoint-url">/api/enrollments</span>
          </div>
          <div class="endpoint">
            <h3>Attendance</h3>
            <p>Track and manage student attendance</p>
            <span class="endpoint-url">/api/attendance</span>
          </div>
          <div class="endpoint">
            <h3>Analytics</h3>
            <p>Reports and dashboards for users based on roles</p>
            <span class="endpoint-url">/api/analytics</span>
          </div>
        </div>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} University Management System - All Rights Reserved</p>
      </div>
    </div>
  </body>
  </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/faculty', facultyRoutes);
app.use('/api/v1/admissions', admissionRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/timetables', timetableRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/forums', forumRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`${err.name}: ${err.message}`.red.bold);
  console.error(err.stack.gray);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

module.exports = app; 