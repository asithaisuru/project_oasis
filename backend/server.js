import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { sessionCookie } from './utils/sessions.js';
import { startEmailWorker } from './utils/emailOutbox.js';
import { pathToFileURL } from 'node:url';

// Routes
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import classRoutes from './routes/classes.js';
import attendanceRoutes from './routes/attendance.js';
import paymentRoutes from './routes/payments.js';
import gradeRoutes from './routes/gradeRoutes.js';

dotenv.config();

const app = express();

app.disable('x-powered-by');
const origins = (process.env.ALLOWED_ORIGINS || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173,http://127.0.0.1:5173')).split(',').map((value) => value.trim()).filter(Boolean);
if (process.env.NODE_ENV === 'production' && (!origins.length || origins.includes('*') || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || /replace|example/i.test(process.env.JWT_SECRET))) throw new Error('Production requires an explicit ALLOWED_ORIGINS list and a random JWT_SECRET of at least 32 characters');
app.use((req, res, next) => {
  if (req.headers.origin && !origins.includes(req.headers.origin)) return res.status(403).json({ success: false, message: 'Origin is not allowed' });
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && sessionCookie(req) && !origins.includes(req.headers.origin)) return res.status(403).json({ success: false, message: 'An allowed Origin is required for cookie-authenticated changes' });
  next();
});
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware
const loginAttempts = new Map();
app.use('/api/auth/login', (req, res, next) => {
  const now = Date.now();
  for (const [key, value] of loginAttempts) if (value.until <= now) loginAttempts.delete(key);
  const key = req.ip;
  const attempt = loginAttempts.get(key) || { count: 0, until: now + 900000 };
  if (++attempt.count > 30 || (!loginAttempts.has(key) && loginAttempts.size >= 10000)) return res.status(429).json({ success: false, message: 'Too many login attempts; try later' });
  loginAttempts.set(key, attempt);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/grades', gradeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Oasis Tuition Backend is running!',
    timestamp: new Date().toISOString()
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = ['ValidationError', 'CastError', 'StrictModeError'].includes(error.name) || error.type === 'entity.parse.failed' ? 400 : error.status === 413 ? 413 : 500;
  res.status(status).json({ success: false, message: status === 500 ? 'Server error' : 'Invalid request' });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  connectDB().then(() => {
    const stopEmailWorker = startEmailWorker();
    process.once('SIGTERM', async () => { await stopEmailWorker(); await mongoose.disconnect(); process.exit(0); });
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  });
}

export default app;
