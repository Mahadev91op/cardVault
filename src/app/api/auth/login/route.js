import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json().catch(() => ({}));
    const { loginIdentifier, password } = body;

    const cleanIdentifier = (loginIdentifier || '').trim();
    const cleanPassword = typeof password === 'string' ? password : '';

    // Hard Validation 1: Required input checks
    if (!cleanIdentifier) {
      return NextResponse.json(
        { error: 'Please enter your registered Email address or Username.' },
        { status: 400 }
      );
    }

    if (!cleanPassword) {
      return NextResponse.json(
        { error: 'Please enter your account password.' },
        { status: 400 }
      );
    }

    // Hard Validation 2: Password minimum length
    if (cleanPassword.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters long.' },
        { status: 400 }
      );
    }

    // Hard Validation 3: Case-insensitive user lookup for both email and username
    const safeRegex = cleanIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { username: { $regex: new RegExp(`^${safeRegex}$`, 'i') } }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { 
          error: `No registered account found for "${cleanIdentifier}". Please check for typos, or click "Create Account" below.`,
          code: 'USER_NOT_FOUND'
        }, 
        { status: 404 }
      );
    }

    // Hard Validation 4: Password match verification
    const isPasswordMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json(
        { 
          error: `Incorrect password for account "${user.username}". Please check Caps Lock or click "Forgot Password?" below to reset it.`,
          code: 'INVALID_PASSWORD'
        }, 
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({ 
      id: user._id, 
      username: user.username, 
      email: user.email,
      isAdmin: user.isAdmin
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: `Authentication service error: ${error.message || 'Database connection failed. Please try again.'}` },
      { status: 500 }
    );
  }
}
