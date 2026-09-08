import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
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
    let token = null;

    // 1. Check Authorization Bearer header (supports localStorage auth across all devices/LAN)
    if (request && request.headers) {
      const authHeader =
        (typeof request.headers.get === 'function' && (request.headers.get('authorization') || request.headers.get('Authorization'))) ||
        request.headers['authorization'] ||
        request.headers['Authorization'];
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    // 2. Fallback to HttpOnly cookie
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get('token')?.value;
      } catch (e) {}
    }

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
