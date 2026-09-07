import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) return null;

    const adminEmails = process.env.ADMIN_EMAILS
      ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
      : [];

    const isEmailAdmin = decoded.email && (
      decoded.email.toLowerCase().includes('admin') ||
      adminEmails.includes(decoded.email.toLowerCase())
    );

    if (decoded.isAdmin || isEmailAdmin) {
      return { ...decoded, isAdmin: true };
    }

    return decoded;
  } catch (e) {
    return null;
  }
}
