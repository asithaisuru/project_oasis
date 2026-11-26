import { after, before, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Never read an Atlas URI or SMTP credential, even if inherited from the shell.
process.env.NODE_ENV = 'test';
process.env.EMAIL_MODE = 'stream';
process.env.JWT_SECRET = 'synthetic-test-signing-key-never-for-production';
process.env.JWT_EXPIRE = '5m';
const messages = [];
const createTransport = nodemailer.createTransport;
mock.method(nodemailer, 'createTransport', (options) => {
  assert.equal(options.streamTransport, true, 'Email must stay in memory');
  const transport = createTransport(options);
  return { sendMail: async (message) => { messages.push(message); return transport.sendMail(message); } };
});

const { default: User } = await import('../models/User.js');
const { default: Student } = await import('../models/Student.js');
const { default: Class } = await import('../models/Class.js');
const { default: Grade } = await import('../models/Grade.js');
const { default: Payment } = await import('../models/Payment.js');
const { default: Attendance } = await import('../models/Attendance.js');
const { default: TeacherProfile } = await import('../models/Teacher.js');
const { createSession } = await import('../utils/sessions.js');
let mongo, server, base, admin, teacher, student, classRecord, gradeId, paymentId;
const tokenFor = async (user) => (await createSession(user)).token;
const request = async (path, { method = 'GET', user, body } = {}) => {
  const response = await fetch(`${base}/api${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${await tokenFor(user)}` } : {}) },
    ...(body && !['GET', 'HEAD'].includes(method) ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(5000),
  });
  return { status: response.status, body: await response.json() };
};

before(async () => {
  mongo = await MongoMemoryServer.create({ instance: { dbName: 'oasis_portfolio_test' } });
  process.env.MONGODB_URI = mongo.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  const { default: app } = await import('../server.js');
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
  admin = await User.create({ name: 'Demo Admin', email: 'admin@example.test', password: 'synthetic-password', role: 'admin' });
  const teacherProfile = await TeacherProfile.create({ name: 'Demo Teacher', email: 'teacher@example.test', phone: '0000000000', subject: 'Maths' });
  teacher = await User.create({ name: 'Demo Teacher', email: 'teacher@example.test', password: 'synthetic-password', role: 'teacher', teacherProfile: teacherProfile._id });
  student = await Student.create({
    name: 'Demo Student', email: 'student@example.test', phone: '0000000000', parentName: 'Demo Parent',
    parentEmail: 'parent@example.test', parentPhone: '0000000000', grade: '10', school: 'Fictional School',
  });
  classRecord = await Class.create({ name: 'Demo Maths', subject: 'Maths', grade: '10', teacher: teacherProfile._id, fee: 2500 });
  student.enrolledClasses = [classRecord._id];
  await student.save();
});

after(async () => {
  if (server) await new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); });
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  mock.restoreAll();
});

test('health endpoint uses the imported app without starting a second server', async () => {
  assert.equal((await request('/health')).status, 200);
});

test('protected workflows reject anonymous callers, including both publishing routes', async () => {
  for (const [method, path] of [
    ['GET', '/students'], ['POST', '/attendance'], ['POST', '/grades'], ['POST', '/payments'],
    ['POST', '/grades/000000000000000000000000/publish'], ['POST', '/grades/class/000000000000000000000000/publish-bulk'],
  ]) assert.equal((await request(path, { method, body: {} })).status, 401, path);
});

test('tokens for missing and inactive users are rejected', async () => {
  assert.equal((await request('/students', { user: { _id: new mongoose.Types.ObjectId() } })).status, 401);
  const inactive = await User.create({ name: 'Demo Inactive', email: 'inactive@example.test', password: 'synthetic-password', isActive: false });
  assert.equal((await request('/students', { user: inactive })).status, 401);
  assert.equal((await request('/auth/login', { method: 'POST', body: { email: inactive.email, password: 'synthetic-password' } })).status, 401);
});

test('teacher cannot delete students or register accounts', async () => {
  assert.equal((await request(`/students/${student.id}`, { method: 'DELETE', user: teacher })).status, 403);
  assert.equal((await request('/auth/register', { method: 'POST', user: teacher, body: { name: 'Demo', email: 'new@example.test', password: 'synthetic-password' } })).status, 403);
  assert.ok(await Student.findById(student.id));
});

test('passwords are hashed and login returns a usable JWT', async () => {
  assert.notEqual(admin.password, 'synthetic-password');
  const result = await request('/auth/login', { method: 'POST', body: { email: admin.email, password: 'synthetic-password' } });
  assert.equal(result.status, 200);
  assert.equal(jwt.verify(result.body.data.token, process.env.JWT_SECRET).id, admin.id);
});

test('QR scanning finds a fictional student without implicitly marking attendance', async () => {
  const result = await request('/attendance/scan', { method: 'POST', user: teacher, body: { qrData: JSON.stringify({ type: 'student_attendance', studentId: student.id }) } });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.student.name, 'Demo Student');
  assert.equal(await Attendance.countDocuments(), 0);
});

test('malformed QR content returns a client error', async () => {
  const result = await request('/attendance/scan', { method: 'POST', user: teacher, body: { qrData: 'invalid-json' } });
  assert.equal(result.status, 400);
});

test('marking attendance twice updates the existing daily student entry', async () => {
  const data = { class: classRecord.id, student: student.id, date: '2026-01-15', status: 'present' };
  assert.equal((await request('/attendance', { method: 'POST', user: teacher, body: data })).status, 200);
  assert.equal((await request('/attendance', { method: 'POST', user: teacher, body: { ...data, status: 'late' } })).status, 200);
  const record = await Attendance.findOne();
  assert.equal(await Attendance.countDocuments(), 1);
  assert.equal(record.students.length, 1);
  assert.equal(record.students[0].status, 'late');
});

test('grade creation validates marks and stores a valid draft', async () => {
  const body = { student: student.id, class: classRecord.id, subject: 'Maths', grade: 'A', marks: 101, examType: 'quiz' };
  assert.equal((await request('/grades', { method: 'POST', user: teacher, body })).status, 400);
  const result = await request('/grades', { method: 'POST', user: teacher, body: { ...body, marks: 85 } });
  assert.equal(result.status, 201);
  assert.equal(result.body.data.isPublished, false);
  gradeId = result.body.data._id;
});

test('publishing persists the publication date and renders one email, repeat is idempotent', async () => {
  const beforeCount = messages.length;
  assert.equal((await request(`/grades/${gradeId}/publish`, { method: 'POST', user: teacher, body: {} })).status, 200);
  assert.ok((await Grade.findById(gradeId)).publishedAt);
  assert.equal(messages.length, beforeCount + 1);
  assert.match(messages.at(-1).to, /student@example.test/);
  assert.match(messages.at(-1).to, /parent@example.test/);
  assert.equal((await request(`/grades/${gradeId}/publish`, { method: 'POST', user: teacher, body: {} })).status, 200);
  assert.equal(messages.length, beforeCount + 1);
});

test('payment creation generates the required receipt ID before validation', async () => {
  const result = await request('/payments', { method: 'POST', user: admin, body: {
    student: student.id, class: classRecord.id, amount: 1800, month: 'January', year: 2026, dueDate: '2026-01-31', collectedBy: admin.id,
  } });
  assert.equal(result.status, 201);
  assert.match(result.body.paymentId, /^PAY\d+$/);
  paymentId = result.body._id;
});

test('mark-paid email shows the payment amount rather than the class fee', async () => {
  const result = await request(`/payments/${paymentId}/mark-paid`, { method: 'PATCH', user: admin, body: { paymentMethod: 'cash' } });
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'paid');
  assert.match(messages.at(-1).html, />1800<\/td>/);
  assert.doesNotMatch(messages.at(-1).html, />2500<\/td>/);
});

test('reverting payment preserves the record and returns it to pending', async () => {
  const result = await request(`/payments/${paymentId}/revert-pending`, { method: 'PATCH', user: admin, body: {} });
  assert.equal(result.status, 200);
  assert.equal((await Payment.findById(paymentId)).status, 'pending');
});

test('existing attendance and grade compound indexes are created', async () => {
  await Attendance.init();
  await Grade.init();
  assert.ok((await Attendance.collection.indexes()).some((index) => index.key.class === 1 && index.key.date === 1 && index.unique));
  assert.ok((await Grade.collection.indexes()).some((index) => index.key.student === 1 && index.key.class === 1));
});

test('unlinked and inactive teacher profiles cannot access student records', async () => {
  const unlinked=await User.create({name:'Unlinked Demo',email:'unlinked@example.test',password:'synthetic-password',role:'teacher'});
  assert.equal((await request('/students',{user:unlinked})).status,403);
  await TeacherProfile.updateOne({_id:teacher.teacherProfile},{status:'inactive'});
  assert.equal((await request('/students',{user:teacher})).status,403);
  await TeacherProfile.updateOne({_id:teacher.teacherProfile},{status:'active'});
});

test('administrator teacher-profile linking is explicit and revokes previous account sessions', async()=>{
  const account=await User.create({name:'Mapped Demo',email:'mapped@example.test',password:'synthetic-password',role:'teacher'});
  const oldToken=await tokenFor(account);
  const path=`/auth/users/${account.id}/teacher-profile`;
  assert.equal((await request(path,{method:'PUT',user:teacher,body:{teacherProfile:teacher.teacherProfile}})).status,403);
  assert.equal((await request(path,{method:'PUT',user:admin,body:{teacherProfile:teacher.teacherProfile}})).status,200);
  const result=await fetch(`${base}/api/students`,{headers:{Authorization:`Bearer ${oldToken}`}});
  assert.equal(result.status,401);
});

test('teacher lists and object routes isolate students, classes, teachers, grades and attendance', async()=>{
  const otherTeacher=await TeacherProfile.create({name:'Other Demo Teacher',email:'otherteacher@example.test',phone:'0000000000',subject:'Maths'});
  const otherClass=await Class.create({name:'Private fixture class',subject:'Maths',grade:'10',teacher:otherTeacher.id,fee:2600});
  const otherStudent=await Student.create({name:'Private Fixture Student',email:'otherstudent@example.test',phone:'0000000000',parentName:'Fictional Parent',parentEmail:'parent@example.test',parentPhone:'0000000000',grade:'10',school:'Fictional School',enrolledClasses:[otherClass.id]});
  const otherGrade=await Grade.create({student:otherStudent.id,class:otherClass.id,subject:'Maths',grade:'A',marks:90,examType:'quiz'});
  for(const path of [`/students/${otherStudent.id}`,`/classes/${otherClass.id}`,`/teachers/${otherTeacher.id}`,`/grades/${otherGrade.id}`]) assert.equal((await request(path,{user:teacher})).status,404,path);
  for(const path of ['/students','/classes','/teachers','/grades']) {
    const result=await request(path,{user:teacher});assert.equal(result.status,200);
    assert.doesNotMatch(JSON.stringify(result.body),/Private Fixture Student|Private fixture class|otherteacher@example.test/);
  }
  assert.equal((await request(`/grades/${otherGrade.id}/publish`,{method:'POST',user:teacher,body:{}})).status,404);
  assert.equal((await request(`/grades/class/${otherClass.id}/publish-bulk`,{method:'POST',user:teacher,body:{}})).status,403);
  assert.equal((await request('/attendance/stats?class='+otherClass.id+'&startDate=2026-01-01&endDate=2026-12-31',{user:teacher})).status,403);
  assert.equal((await request('/attendance/scan',{method:'POST',user:teacher,body:{qrData:{type:'student_attendance',studentId:otherStudent.id}}})).status,404);
  assert.equal((await request('/attendance',{method:'POST',user:teacher,body:{class:classRecord.id,student:otherStudent.id,date:'2026-02-01',status:'present'}})).status,403);
  assert.equal((await Grade.findById(otherGrade.id)).isPublished,false);
});

test('teacher writes to enrollments, classes, staff and financial records are denied',async()=>{
  for(const [method,path,body] of [
    ['PUT',`/students/${student.id}`,{name:'Changed'}],['POST',`/students/${student.id}/enroll`,{classId:classRecord.id}],
    ['PUT',`/students/${student.id}/enrollments`,{classIds:[]}],['PUT',`/classes/${classRecord.id}`,{fee:1}],
    ['PUT',`/teachers/${teacher.teacherProfile}`,{name:'Changed'}],['GET','/payments'],['PATCH',`/payments/${paymentId}/mark-paid`,{}],
    ['GET',`/payments/student/${student.id}`],['POST','/payments/generate/bulk',{months:1}],
  ]) assert.equal((await request(path,{method,user:teacher,body})).status,403,`${method} ${path}`);
});

test('teacher fee indicator excludes receipt amounts and payment details',async()=>{
  const date=new Date();
  await Payment.create({student:student.id,class:classRecord.id,amount:1999,month:date.toLocaleString('default',{month:'long'}),year:date.getFullYear(),dueDate:date,status:'paid'});
  const result=await request(`/payments/student/${student.id}/current`,{user:teacher});
  assert.equal(result.status,200);assert.equal(result.body.data.status,'paid');
  for(const field of ['amount','paymentId','paymentMethod','paymentDate']) assert.equal(field in result.body.data,false,field);
});

test('concurrent human ID allocation uses the largest historical suffix and preserves existing records',async()=>{
  const legacy=await Student.create({studentId:'STU9000',name:'Legacy Demo',email:'legacy@example.test',phone:'0000000000',parentName:'Fictional',parentEmail:'parent@example.test',parentPhone:'0000000000',grade:'10',school:'Fictional'});
  const records=await Promise.all(Array.from({length:20},(_,i)=>Student.create({name:`Concurrent Demo ${i}`,email:`concurrent-${i}@example.test`,phone:'0000000000',parentName:'Fictional',parentEmail:'parent@example.test',parentPhone:'0000000000',grade:'10',school:'Fictional'})));
  assert.equal(new Set(records.map((row)=>row.studentId)).size,20);
  assert.ok(records.every((row)=>Number(row.studentId.slice(3))>9000));
  assert.equal((await Student.findById(legacy.id)).studentId,'STU9000');
});

test('grade edits cannot bypass the publication workflow or alter its timestamp',async()=>{
  const before=await Grade.findById(gradeId);
  const result=await request(`/grades/${gradeId}`,{method:'PUT',user:teacher,body:{isPublished:false,publishedAt:'2000-01-01'}});
  assert.equal(result.status,400);
  assert.equal(Number((await Grade.findById(gradeId)).publishedAt),Number(before.publishedAt));
});

test('concurrent publication preserves one timestamp, one outbox event and one delivery',async()=>{
  const grade=await Grade.create({student:student.id,class:classRecord.id,subject:'Maths',grade:'A',marks:90,examType:'quiz'});
  const before=messages.length;
  const results=await Promise.all(Array.from({length:6},()=>request(`/grades/${grade.id}/publish`,{method:'POST',user:teacher,body:{}})));
  assert.ok(results.every((result)=>result.status===200));
  assert.equal(new Set(results.map((result)=>result.body.data.publishedAt)).size,1);
  assert.equal(messages.length,before+1);
  const {default:EmailJob}=await import('../models/EmailJob.js');
  assert.equal(await EmailJob.countDocuments({'guard.record':grade.id}),1);
});

test('grade and receipt templates escape stored markup and quoted attributes',async()=>{
  const original=student.name;student.name='<img src=x onerror="alert(1)">';await student.save();
  const grade=await Grade.create({student:student.id,class:classRecord.id,subject:'Maths',grade:'A',marks:90,examType:'quiz',comments:'<script>alert(1)</script>'});
  assert.equal((await request(`/grades/${grade.id}/publish`,{method:'POST',user:teacher,body:{}})).status,200);
  assert.match(messages.at(-1).html,/&lt;img/);assert.match(messages.at(-1).html,/&lt;script&gt;/);assert.doesNotMatch(messages.at(-1).html,/<script|<img src=x/);
  await request(`/payments/${paymentId}/mark-paid`,{method:'PATCH',user:admin,body:{transactionId:'<img src=x>',notes:'<script>bad</script>'}});
  assert.match(messages.at(-1).html,/&lt;script&gt;bad/);assert.doesNotMatch(messages.at(-1).html,/<script|<img src=x/);
  student.name=original;await student.save();
});

test('repeated mark-paid requests preserve the receipt timestamp and do not duplicate delivery',async()=>{
  const before=await Payment.findById(paymentId);const count=messages.length;
  const results=await Promise.all(Array.from({length:4},()=>request(`/payments/${paymentId}/mark-paid`,{method:'PATCH',user:admin,body:{paymentMethod:'card'}})));
  assert.ok(results.every((result)=>result.status===200));assert.equal(messages.length,count);
  assert.equal(Number((await Payment.findById(paymentId)).paymentDate),Number(before.paymentDate));
});

test('failed SMTP delivery remains pending and a retry succeeds without republishing',async()=>{
  const {default:EmailJob}=await import('../models/EmailJob.js');const {deliverEmail}=await import('../utils/emailOutbox.js');
  const grade=await Grade.create({student:student.id,class:classRecord.id,subject:'Maths',grade:'A',marks:90,examType:'quiz'});
  const working=nodemailer.createTransport;
  nodemailer.createTransport=()=>({sendMail:async()=>{throw new Error('Synthetic SMTP failure');}});
  try { const result=await request(`/grades/${grade.id}/publish`,{method:'POST',user:teacher,body:{}});assert.equal(result.status,200);assert.equal(result.body.emailPending,true); }
  finally {nodemailer.createTransport=working;}
  const job=await EmailJob.findOne({'guard.record':grade.id});assert.equal(job.status,'pending');assert.equal(job.attempts,1);
  const timestamp=Number((await Grade.findById(grade.id)).publishedAt);
  await EmailJob.updateOne({_id:job.id},{nextAttempt:new Date(0)});await deliverEmail(job.id);
  assert.equal((await EmailJob.findById(job.id)).status,'sent');assert.equal(Number((await Grade.findById(grade.id)).publishedAt),timestamp);
});

test('cookie sessions are HttpOnly, logout revokes bearer reuse and untrusted origins are blocked',async()=>{
  const response=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:5173'},body:JSON.stringify({email:admin.email,password:'synthetic-password'})});
  assert.equal(response.status,200);const cookie=response.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);
  const token=(await response.json()).data.token;
  assert.equal((await fetch(`${base}/api/auth/profile`,{headers:{Cookie:cookie.split(';')[0]}})).status,200);
  assert.equal((await fetch(`${base}/api/auth/logout`,{method:'POST',headers:{Cookie:cookie.split(';')[0]}})).status,403);
  assert.equal((await fetch(`${base}/api/auth/logout`,{method:'POST',headers:{Cookie:cookie.split(';')[0],Origin:'http://localhost:5173'}})).status,200);
  assert.equal((await fetch(`${base}/api/students`,{headers:{Authorization:`Bearer ${token}`}})).status,401);
  assert.equal((await fetch(`${base}/api/health`,{headers:{Origin:'https://evil.example.test'}})).status,403);
});

test('expired, legacy and student-role tokens cannot authenticate staff APIs',async()=>{
  const {default:AuthSession}=await import('../models/AuthSession.js');const {token}=await createSession(admin);
  await AuthSession.updateOne({_id:jwt.decode(token).sid},{expiresAt:new Date(0)});
  const legacy=jwt.sign({id:admin.id},process.env.JWT_SECRET,{expiresIn:'5m'});
  for(const credential of [token,legacy]) assert.equal((await fetch(`${base}/api/students`,{headers:{Authorization:`Bearer ${credential}`}})).status,401);
  const id=new mongoose.Types.ObjectId();await User.collection.insertOne({_id:id,name:'Fictional Student Account',email:'not-supported@example.test',role:'student',isActive:true});
  assert.equal((await request('/students',{user:{_id:id}})).status,401);
});

test('password changes require the current password and revoke all prior sessions',async()=>{
  const account=await User.create({name:'Password Demo',email:'password@example.test',password:'synthetic-password',role:'admin'});
  const old=await tokenFor(account);
  assert.equal((await request('/auth/profile',{method:'PUT',user:account,body:{password:'new-synthetic-password'}})).status,400);
  assert.equal((await request('/auth/profile',{method:'PUT',user:account,body:{password:'new-synthetic-password',currentPassword:'synthetic-password'}})).status,200);
  assert.equal((await fetch(`${base}/api/auth/profile`,{headers:{Authorization:`Bearer ${old}`}})).status,401);
});
