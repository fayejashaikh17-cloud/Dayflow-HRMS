# Dayflow - Human Resource Management System

**Every workday, perfectly aligned.**

A comprehensive HRMS (Human Resource Management System) built with HTML, CSS, JavaScript, Node.js, and MongoDB.

## Features

### Authentication & Authorization
- User registration (Sign Up) with Employee ID, Email, Password, and Role
- Secure login (Sign In) with JWT authentication
- Role-based access control (Admin/HR vs Employee)

### Employee Dashboard
- Quick access cards for Profile, Attendance, Leave Requests, and Payroll
- Recent activity feed

### Admin/HR Dashboard
- Employee management
- Attendance overview
- Leave approval dashboard
- Payroll management
- Analytics and reports

### Employee Profile Management
- View personal details, job details, and salary structure
- Edit personal information (address, phone, profile picture)
- Admin can edit all employee details

### Attendance Management
- Daily check-in/check-out functionality
- Daily and weekly attendance views
- Status tracking (Present, Absent, Half-day, Leave)
- Working hours calculation

### Leave & Time-Off Management
- Apply for leave (Paid, Sick, Unpaid, Vacation, Personal)
- Leave request status tracking (Pending, Approved, Rejected)
- Admin/HR approval workflow with comments
- Automatic attendance update on approval

### Payroll/Salary Management
- Employee payroll view (read-only)
- Admin payroll control and generation
- Salary structure management
- Monthly payroll reports
- Email notifications for salary slips

### Additional Features
- Email notifications for leave requests and approvals
- Analytics dashboard with monthly breakdown
- Beautiful, modern UI with responsive design

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js with Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Email:** Nodemailer

## Installation

1. **Clone or download the project**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Update the following variables:
     ```
     PORT=3000
     MONGODB_URI=mongodb://localhost:27017/dayflow-hrms
     JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=your-app-password
     ```

4. **Start MongoDB:**
   - Make sure MongoDB is running on your system
   - Default connection: `mongodb://localhost:27017/dayflow-hrms`

5. **Run the application:**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access the application:**
   - Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
hrms/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   ├── User.js              # User model
│   ├── Attendance.js        # Attendance model
│   ├── Leave.js             # Leave model
│   └── Payroll.js           # Payroll model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── employee.js          # Employee routes
│   ├── attendance.js        # Attendance routes
│   ├── leave.js             # Leave routes
│   └── payroll.js           # Payroll routes
├── utils/
│   └── emailService.js      # Email service
├── public/
│   ├── index.html           # Login page
│   ├── signup.html          # Sign up page
│   ├── employee-dashboard.html
│   ├── admin-dashboard.html
│   ├── profile.html         # Profile page
│   ├── attendance.html      # Attendance page
│   ├── leave.html           # Leave management
│   ├── payroll.html         # Payroll page
│   ├── employees.html       # Employee list (Admin)
│   ├── reports.html         # Reports (Admin)
│   ├── styles.css           # Main stylesheet
│   └── script.js            # Frontend JavaScript
├── server.js                 # Main server file
├── package.json
└── README.md
```

## Usage

### Creating an Account

1. Navigate to the sign-up page
2. Fill in:
   - Employee ID
   - Email
   - Password (minimum 6 characters)
   - Role (Employee or Admin/HR Officer)
3. Click "Sign Up"

### Employee Features

- **Profile:** View and edit personal information
- **Attendance:** Check in/out daily and view attendance records
- **Leave:** Apply for leave requests
- **Payroll:** View salary details and payroll history

### Admin/HR Features

- **Employees:** View and manage all employees
- **Attendance:** View attendance records for all employees
- **Leave:** Approve or reject leave requests
- **Payroll:** Generate payroll, update salary structures
- **Reports:** View analytics and monthly breakdowns

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user

### Employee
- `GET /api/employee/all` - Get all employees (Admin only)
- `GET /api/employee/:id` - Get employee by ID
- `PUT /api/employee/:id` - Update employee profile

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/records` - Get attendance records
- `GET /api/attendance/all` - Get all attendance (Admin only)

### Leave
- `POST /api/leave/apply` - Apply for leave
- `GET /api/leave/requests` - Get leave requests
- `PUT /api/leave/:id/approve` - Approve/reject leave (Admin only)

### Payroll
- `GET /api/payroll/records` - Get payroll records
- `POST /api/payroll/generate` - Generate payroll (Admin only)
- `PUT /api/payroll/salary/:employeeId` - Update salary structure (Admin only)
- `GET /api/payroll/analytics` - Get analytics (Admin only)

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Role-based access control implemented
- Email verification recommended for production

## Future Enhancements

- Document upload functionality
- Advanced reporting and analytics
- Mobile app support
- Real-time notifications
- Calendar integration
- Performance reviews
- Training management

## License

This project is open source and available for use.

## Support

For issues or questions, please refer to the project documentation or contact the development team.

