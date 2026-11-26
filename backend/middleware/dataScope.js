import mongoose from 'mongoose';
import Class from '../models/Class.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';

export function scopeFor(model, req) {
  if (req.user?.role === 'admin') return {};
  const classes = req.staffScope?.classes || [];
  const students = req.staffScope?.students || [];
  if (model === 'Teacher') return { _id: req.user?.teacherProfile || null };
  if (model === 'Class') return { _id: { $in: classes } };
  if (model === 'Student') return { _id: { $in: students } };
  if (['Grade', 'Attendance', 'Payment'].includes(model)) return { class: { $in: classes } };
  return { _id: null };
}

const denied = (res, status, message) => res.status(status).json({ success: false, message });
export async function staffScope(req, res, next) {
  try {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value !== 'string' || value.length > 200) return denied(res, 400, 'Invalid query parameter');
      if (key === 'search') req.query[key] = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    if (req.query.page && (!/^\d+$/.test(req.query.page) || Number(req.query.page) < 1)) return denied(res, 400, 'Invalid page');
    if (req.query.limit && (!/^\d+$/.test(req.query.limit) || Number(req.query.limit) < 1 || Number(req.query.limit) > 1000)) return denied(res, 400, 'Limit must be between 1 and 1000');
    for (const [key, id] of Object.entries(req.params)) if (/(^id$|Id$)/.test(key) && !mongoose.isObjectIdOrHexString(id)) return denied(res, 400, 'Invalid record ID');
    for (const field of ['student', 'studentId', 'class', 'classId', 'teacher', 'teacherProfile', 'collectedBy']) if (req.body?.[field] !== undefined && !mongoose.isObjectIdOrHexString(req.body[field])) return denied(res, 400, 'Invalid referenced record ID');
    if (req.user.role === 'admin' && ['grades', 'attendance'].includes(req.baseUrl.split('/').at(-1)) && req.method === 'POST' && req.body?.class && req.body?.student && !await Student.exists({ _id: req.body.student, enrolledClasses: req.body.class })) return denied(res, 400, 'Student is not enrolled in this class');
    if (req.baseUrl === '/api/auth') return next();
    if (req.user.role === 'admin') return next();
    if (req.user.role !== 'teacher' || !req.user.teacherProfile || !await Teacher.exists({ _id: req.user.teacherProfile, status: 'active' })) return denied(res, 403, 'An active, administrator-linked teacher profile is required');
    const classes = await Class.find({ teacher: req.user.teacherProfile }).distinct('_id');
    const students = await Student.find({ enrolledClasses: { $in: classes } }).distinct('_id');
    req.staffScope = { classes, students };
    const ownsClass = (id) => classes.some((value) => String(value) === String(id));
    const ownsStudent = (id) => students.some((value) => String(value) === String(id));
    const resource = req.baseUrl.split('/').at(-1);
    if (['students', 'teachers', 'classes'].includes(resource) && !['GET', 'HEAD'].includes(req.method)) return denied(res, 403, 'Administrator access required');
    if (resource === 'payments' && !/^\/student\/[^/]+\/current\/?$/.test(req.path)) return denied(res, 403, 'Financial records require administrator access');
    const classId = req.body?.class || req.body?.classId || req.query.class || req.query.classId || req.params.classId;
    if (classId && classId !== 'all' && !ownsClass(classId)) return denied(res, 403, 'Class is outside your teaching assignment');
    const studentId = req.body?.student || req.body?.studentId || req.query.student || req.query.studentId || req.params.studentId;
    if (studentId && studentId !== 'all' && !ownsStudent(studentId)) return denied(res, 403, 'Student is outside your teaching assignment');
    if (classId && studentId && !await Student.exists({ _id: studentId, enrolledClasses: classId })) return denied(res, 400, 'Student is not enrolled in this class');
    if (resource === 'attendance' && req.path === '/stats' && !classId) return denied(res, 400, 'A class is required');
    // Student details may contain enrollments in other teachers’ classes.
    const json = res.json.bind(res);
    res.json = (body) => {
      const clean = (value) => {
        if (!value || typeof value !== 'object') return value;
        if (Array.isArray(value)) return value.map(clean);
        if (value instanceof Date || value instanceof mongoose.Types.ObjectId) return value;
        const object = typeof value.toJSON === 'function' ? value.toJSON() : value;
        if (!object || typeof object !== 'object') return object;
        return Object.fromEntries(Object.entries(object).map(([key, item]) => [key, ['enrolledClasses', 'assignedClasses'].includes(key) && Array.isArray(item) ? item.filter((row) => ownsClass(row?._id || row)).map(clean) : key === 'students' && Array.isArray(item) ? item.filter((row) => ownsStudent(row.student?._id || row.student || row._id || row)).map(clean) : clean(item)]));
      };
      return json(clean(body));
    };
    next();
  } catch (error) { next(error); }
}
