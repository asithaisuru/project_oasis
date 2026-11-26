import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import AuthSession from '../models/AuthSession.js';
import { createSession, cookieOptions } from '../utils/sessions.js';

const publicUser = (user) => ({ _id: user._id, name: user.name, email: user.email, role: user.role, teacherProfile: user.teacherProfile, phone: user.phone, address: user.address, bio: user.bio, isActive: user.isActive, lastLogin: user.lastLogin, createdAt: user.createdAt, updatedAt: user.updatedAt });
async function signedIn(res, user) {
  const { token, expiresAt } = await createSession(user);
  res.cookie('oasis_session', token, { ...cookieOptions(), expires: expiresAt });
  return { ...publicUser(user), token };
}

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'teacher', teacherProfile } = req.body;
    if (!['admin', 'teacher'].includes(role)) return res.status(400).json({ success: false, message: 'Only admin and teacher staff accounts are supported' });
    if (teacherProfile && !await Teacher.exists({ _id: teacherProfile, status: 'active' })) return res.status(400).json({ success: false, message: 'Active teacher profile required' });
    const user = await User.create({ name, email, password, role, ...(role === 'teacher' && teacherProfile ? { teacherProfile } : {}) });
    // Creating another staff account never signs the administrator in as that account.
    res.status(201).json({ success: true, message: 'User registered successfully', data: publicUser(user) });
  } catch (error) { if (error.code === 11000) return res.status(409).json({ success: false, message: 'User already exists' }); next(error); }
};

export const loginUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user?.isActive || !['admin', 'teacher'].includes(user.role) || !await user.matchPassword(req.body.password)) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    user.lastLogin = new Date();
    await user.save();
    res.json({ success: true, message: 'Login successful', data: await signedIn(res, user) });
  } catch (error) { next(error); }
};

export const logoutUser = async (req, res, next) => {
  try { await AuthSession.updateOne({ _id: req.sessionId, user: req.user._id }, { revokedAt: new Date() }); res.clearCookie('oasis_session', cookieOptions()); res.json({ success: true }); }
  catch (error) { next(error); }
};

export const getUserProfile = async (req, res) => res.json({ success: true, data: publicUser(req.user) });
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    for (const key of ['name', 'email', 'phone', 'address', 'bio']) if (req.body[key] !== undefined) user[key] = req.body[key];
    if (req.body.password) {
      if (!req.body.currentPassword || !await user.matchPassword(req.body.currentPassword)) return res.status(400).json({ success: false, message: 'Current password is required and must be correct' });
      user.password = req.body.password;
    }
    await user.save();
    if (req.body.password) await AuthSession.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
    res.json({ success: true, data: await signedIn(res, user) });
  } catch (error) { if (error.code === 11000) return res.status(409).json({ success: false, message: 'Email already exists' }); next(error); }
};

export const linkTeacherProfile = async (req, res, next) => {
  try {
    const { teacherProfile } = req.body;
    if (!await Teacher.exists({ _id: teacherProfile, status: 'active' })) return res.status(400).json({ success: false, message: 'Active teacher profile required' });
    const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'teacher' }, { teacherProfile }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'Teacher account not found' });
    await AuthSession.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
    res.json({ success: true, data: publicUser(user) });
  } catch (error) { next(error); }
};
