# Quick Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or connection string)

## Step-by-Step Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create Environment File**
   Create a `.env` file in the root directory with the following content:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/dayflow-hrms
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

   **Note:** 
   - For MongoDB, you can use MongoDB Atlas (cloud) or local MongoDB
   - For email, if using Gmail, you'll need to generate an "App Password" from your Google Account settings
   - JWT_SECRET should be a long, random string for production

3. **Start MongoDB**
   - If using local MongoDB, make sure it's running
   - If using MongoDB Atlas, update MONGODB_URI with your connection string

4. **Run the Application**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open your browser
   - Navigate to: `http://localhost:3000`

## First Steps

1. **Create an Admin Account**
   - Click "Sign Up"
   - Fill in the form
   - Select "Admin / HR Officer" as the role
   - Complete registration

2. **Create Employee Accounts**
   - Sign in as Admin
   - Employees can sign up themselves, or you can create accounts for them
   - Employees should select "Employee" role

3. **Start Using the System**
   - Employees can check in/out
   - Apply for leave
   - View their profile and payroll
   - Admins can manage everything

## Troubleshooting

**MongoDB Connection Error:**
- Make sure MongoDB is running
- Check your MONGODB_URI in .env file
- For MongoDB Atlas, ensure your IP is whitelisted

**Email Not Working:**
- Email is optional - the system will work without it
- For Gmail, use App Password (not your regular password)
- Check EMAIL_USER and EMAIL_PASS in .env

**Port Already in Use:**
- Change PORT in .env file to a different port (e.g., 3001)

## Default Configuration

- Server runs on port 3000
- Database: dayflow-hrms
- JWT token expires in 7 days

