import User from '../models/User.js';
import { readSession, sessionCookie } from '../utils/sessions.js';
import { staffScope } from './dataScope.js';

export const protect = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.match(/^Bearer ([^ ]+)$/)?.[1];
    const decoded = await readSession(bearer || sessionCookie(req));
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user?.isActive || !['admin', 'teacher'].includes(req.user.role)) throw new Error('Unavailable user');
    req.sessionId = decoded.sid;
    return staffScope(req, res, next);
  } catch { return res.status(401).json({ success: false, message: 'Not authorized, sign in again' }); }
};

export const admin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({ success: false, message: 'Not authorized as admin' });
