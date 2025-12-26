# Project Oasis - Class Administration System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Platform](https://img.shields.io/badge/platform-Desktop%20%7C%20Web-lightgrey)
![Access](https://img.shields.io/badge/Access-Admin_Only-red?style=rounded-square)
## 📋 Overview

**Project Oasis** is a desktop-based class administration system designed for a single administrator (class admin) to manage all aspects of their educational institution. The system runs locally on a PC while using MongoDB Atlas for cloud data storage. Students and parents receive email notifications but do not access the web interface.

## ✨ Features

### 🎓 Admin-Only Features
- **Student Management** - Add, edit, and manage student profiles
- **Class Management** - Create and schedule classes, assign students
- **Teacher Management** - Manage teacher information and assignments
- **Grade Management** - Enter grades and publish with email notifications
- **Payment Tracking** - Record payments and send email receipts
- **Attendance System** - QR code-based attendance marking

### 📧 Email Notifications (External Users)
- **Grade Publications** - Students/parents receive grade emails
- **Payment Confirmations** - Payment receipt emails
- **Attendance Updates** - Regular attendance summaries
- **General Announcements** - Broadcast messages to all

## 🛠️ Technology Stack

### Frontend (Admin Interface)
- **React 19** - Single-page admin dashboard
- **Vite** - Build tool and development server  
- **Tailwind CSS 4** - Styling framework
- **React Router DOM** - Navigation within admin panel
- **React Icons** - Icon library
- **Axios** - API communication
- **QR Code Integration** - For attendance system

### Backend
- **Node.js & Express** - Local REST API server
- **MongoDB Atlas** - Cloud database storage
- **JWT** - Authentication for admin
- **Nodemailer** - Email notification system
- **CORS** - Configured for local development

## 🚀 Quick Installation Guide

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account (free tier available)
- Gmail account for email notifications

### Step 1: Clone Repository
```bash
git clone https://github.com/asithaisuru/project_oasis.git
cd project_oasis
```

### Step 2: Backend Setup
```bash
cd backend
npm install
```

Create .env file in backend/ folder:
```text
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/oasis_db
JWT_SECRET=your_admin_secret_key_here
JWT_EXPIRE=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_institute_email@gmail.com
SMTP_PASS=your_app_password_here
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

### Step 4: Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev
```
```bash
# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Step 5: Access Application

Open browser and go to: http://localhost:3000

## 📁 Project Structure
```text
project_oasis/
├── frontend/                 # React admin interface
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Main pages (Grades, Students, etc.)
│   │   ├── services/       # API services
│   │   └── App.jsx         # Main app component
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
│
├── backend/                 # Node.js backend
│   ├── controllers/        # API controllers
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   ├── utils/             # Email and utility functions
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
│
└── README.md              # This file
```

## 📊 Core Modules

### 1. Student Management
- Add/Edit/Delete student profiles
- Track enrollment and contact information
- Bulk student operations

### 2. Class Management
- Create and schedule classes
- Assign teachers and students
- Set fees and durations

### 3. Grade Management
- Enter student marks and grades
- Publish grades with email notifications
- Bulk grade publishing

### 4. Payment System
- Record fee payments
- Generate and send payment receipts
- Track pending payments

### 5. Attendance System
- Generate QR codes for class sessions
- Scan student QR codes to mark attendance
- Real-time attendance tracking

## 📧 Email System Setup

### Gmail Configuration
- Use a dedicated Gmail account for your institute
- Enable 2-factor authentication in Google Account

### Generate app password:
Go to Google Account → Security → 2-Step Verification → App passwords

Select "Mail" and "Other" (name it "Project Oasis")

Copy the 16-character password to your .env file

### Email Types
- **Grade Notifications** : Sent when grades are published
- **Payment Receipts**: Sent after successful payments
- **Attendance Summaries**: Regular attendance reports
- **Announcements**: General institute updates

## 🚀 Production Deployment

### Build for Production
```bash
# Build frontend
cd frontend
npm run build

# The built files will be in: frontend/dist/
```

### Configure Backend to Serve Frontend
Update backend/server.js:

```javascript
const path = require('path');
const express = require('express');
const app = express();

// ... your API routes ...

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle all other routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

### Create Startup Script (Windows)

Create start.bat in project root:

```text
@echo off
echo Starting Project Oasis Administration System...
cd backend
node server.js
pause
```

### Access in Production

Local: http://localhost:5000

Network: http://[YOUR-PC-IP]:5000

## 🔒 Security Notes

### Important Security Practices
Use Strong Credentials:

    Strong JWT secret in .env

    Secure MongoDB Atlas password

    Gmail app password (not regular password)

Data Protection:

    All data stored in MongoDB Atlas (cloud)

    No sensitive data stored locally

    Automatic backups via MongoDB Atlas

Access Control:

    Single admin account only

    No student/parent web access

    All external communication via email

## 🐛 Troubleshooting

### Common Issues
Issue	Solution
Application won't start	Check Node.js version, reinstall dependencies
Database connection failed	Verify MongoDB Atlas URI, check internet
Emails not sending	Verify Gmail app password, check SMTP settings
QR code not scanning	Ensure camera permissions, check QR expiration

### Checking Logs
Backend Logs: Output in terminal/command prompt

Email Logs: Console shows email delivery status

Browser Console: F12 for frontend errors

## 📝 Usage Instructions

### Daily Operations
- Start the application using start.bat
- Log in with admin credentials
- Navigate to desired module (Students, Classes, Grades, etc.)
- Perform daily administrative tasks
- Send notifications as needed

### Bulk Operations
- Use bulk publish for multiple grades
- Bulk student enrollment
- Mass email notifications
- Batch payment recording

## 💾 Data Management

### Storage
 - Primary: MongoDB Atlas (cloud)
- Local: Application files only, no data storage
- Backups: Automatic daily backups by MongoDB Atlas

### Data Export
- All data can be exported from the admin interface:
    - Student lists
    - Grade reports
    - Payment records
    - Attendance summaries

## 🤝 Support

- Getting Help
    - Check this README for guidance
    - Review error messages in console
    - Ensure all prerequisites are met

- Maintenance Checklist
    - Regular dependency updates
    - Test email notifications weekly
    - Verify database backups monthly

- Update .env credentials as needed

## ⚠️ Important Notes

Single User System - Designed for one administrator only

No Web Portal - Students/parents interact via email only

Internet Required - Needs connection for MongoDB Atlas

Email Dependent - Primary communication method is email

Local Deployment - Runs on local PC, accessible via browser

---

**Project Oasis** - Complete Class Administration System
