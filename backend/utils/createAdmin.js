// Operator-only bootstrap. Never run automatically during server startup or tests.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
dotenv.config();
const expected = process.argv.find((value) => value.startsWith('--confirm-database='))?.slice('--confirm-database='.length);
if (!expected || !process.env.MONGODB_URI || !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(process.env.ADMIN_EMAIL || '') || (process.env.ADMIN_PASSWORD || '').length < 12) throw new Error('Set MONGODB_URI, ADMIN_EMAIL and a unique ADMIN_PASSWORD (12+ characters), and pass --confirm-database=<exact database name>');
try {
  await mongoose.connect(process.env.MONGODB_URI);
  if (mongoose.connection.name !== expected) throw new Error('Database confirmation does not match; no user created');
  if (await User.exists({ role: 'admin', isActive: true })) throw new Error('An active administrator already exists; no account or password changed');
  await User.create({ name: 'System Administrator', email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, role: 'admin' });
  console.log('Administrator created. Remove ADMIN_PASSWORD from the shell environment.');
} finally { await mongoose.disconnect(); }
