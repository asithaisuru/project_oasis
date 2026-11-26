import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import AuthSession from '../models/AuthSession.js';

const options = { algorithms: ['HS256'], issuer: 'oasis', audience: 'oasis-staff' };
export const cookieOptions = () => {
  const sameSite = process.env.SESSION_SAME_SITE || 'lax';
  if (!['lax', 'strict', 'none'].includes(sameSite) || (sameSite === 'none' && process.env.NODE_ENV !== 'production')) throw new Error('Invalid session cookie policy');
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite, path: '/api' };
};

export async function createSession(user) {
  const sid = randomUUID();
  const token = jwt.sign({ id: String(user._id), sid }, process.env.JWT_SECRET, {
    algorithm: 'HS256', issuer: options.issuer, audience: options.audience,
    expiresIn: process.env.JWT_EXPIRE || '8h',
  });
  const expiresAt = new Date(jwt.decode(token).exp * 1000);
  await AuthSession.create({ _id: sid, user: user._id, expiresAt });
  return { token, expiresAt };
}

export async function readSession(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET, options);
  if (!decoded.sid || !await AuthSession.exists({ _id: decoded.sid, user: decoded.id, revokedAt: null, expiresAt: { $gt: new Date() } })) throw new Error('Session expired or revoked');
  return decoded;
}

export const sessionCookie = (req) => {
  const value = req.headers.cookie?.match(/(?:^|;\s*)oasis_session=([^;]+)/)?.[1];
  try { return value ? decodeURIComponent(value) : null; } catch { return null; }
};
