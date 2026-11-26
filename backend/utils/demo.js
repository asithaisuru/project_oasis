import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

// Override inherited live settings before importing the application.
process.env.NODE_ENV = 'development';
process.env.EMAIL_MODE = 'stream';
process.env.JWT_SECRET = randomUUID();
process.env.JWT_EXPIRE = '1h';
process.env.ALLOWED_ORIGINS = 'http://127.0.0.1:5175,http://localhost:5175';
const mongo = await MongoMemoryServer.create({ instance: { dbName: 'oasis_fictional_demo' } });
process.env.MONGODB_URI = mongo.getUri();
await mongoose.connect(process.env.MONGODB_URI);
const { default: User } = await import('../models/User.js');
const { default: Student } = await import('../models/Student.js');
const { default: Class } = await import('../models/Class.js');
const { default: Teacher } = await import('../models/Teacher.js');
await User.create({ name: 'Demo Admin', email: 'admin@example.test', password: 'demo-only-local', role: 'admin' });
const teacher = await Teacher.create({ name: 'Demo Teacher', email: 'teacher@example.test', phone: '0000000000', subject: 'Maths' });
await User.create({ name: 'Demo Teacher', email: 'teacher@example.test', password: 'demo-only-local', role: 'teacher', teacherProfile: teacher._id });
const classRecord = await Class.create({ name: 'Demo Maths', subject: 'Maths', grade: '10', teacher: teacher._id, fee: 2500 });
await Student.create({ name: 'Demo Student', email: 'student@example.test', phone: '0000000000', parentName: 'Demo Parent', parentEmail: 'parent@example.test', parentPhone: '0000000000', grade: '10', school: 'Fictional School', enrolledClasses: [classRecord.id] });
const { default: app } = await import('../server.js');
const server = app.listen(5055, '127.0.0.1', () => {
  console.log('Fictional demo: http://127.0.0.1:5055/api');
  console.log('Login: admin@example.test / demo-only-local');
  console.log('Frontend VITE_API_URL=http://127.0.0.1:5055/api. Email stays in memory.');
});
async function shutdown() {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
