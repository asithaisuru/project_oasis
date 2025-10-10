import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import teacherRoutes from './routes/teachers.js';
import classRoutes from './routes/classes.js';
import attendanceRoutes from './routes/attendance.js';
import paymentRoutes from './routes/payments.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' })); // Increase from default 100kb to 10mb
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    message: 'Oasis Tuition Backend is running!',
    timestamp: new Date().toISOString()
  });
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

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
});

export default app;