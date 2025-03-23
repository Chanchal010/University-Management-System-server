# University Management System

A comprehensive backend system for university management built with Node.js, Express, and MongoDB.

## Features

### User Management
- Role-Based Access Control (RBAC) for students, faculty, and administrators
- Secure authentication with JWT and bcryptjs
- Profile management with document uploads

### Academic Modules
- Admissions management with online applications
- Course management with instructor assignments
- Real-time attendance tracking
- Exam and grading system
- Timetable scheduling

### Communication Tools
- Announcements and notifications
- Discussion forums

### Analytics & Reporting
- Dashboards with visualizations
- Custom reports with PDF/Excel export

### Security
- Data validation with express-validator
- Password encryption with bcryptjs
- Rate limiting and CORS protection
- Audit logs for user activities
- Optimized database queries with pagination

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **Multer** - File uploads
- **Nodemailer** - Email notifications

## Installation

1. Clone the repository
```
git clone https://github.com/yourusername/university-management-system.git
cd university-management-system
```

2. Install dependencies
```
npm install
```

3. Configure environment variables
Create a `.env` file in the root directory with the following variables:
```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/university-management
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
EMAIL_SERVICE=gmail
EMAIL_USERNAME=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@university.com
MAX_FILE_UPLOAD=5000000
```

4. Run the server
```
# Development mode
npm run dev

# Production mode
npm start
```

## API Documentation

API documentation is available at `/api-docs` when the server is running.

## License

MIT 