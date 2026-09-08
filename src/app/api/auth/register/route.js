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
    const { username, email, password } = body;

    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if email or username already exists (case-insensitive)
    const safeRegex = cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        { username: { $regex: new RegExp(`^${safeRegex}$`, 'i') } }
      ],
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return NextResponse.json({ error: 'This email address is already registered. Please sign in or use Forgot Password.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'This username is already taken. Please choose another username.' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine if user is admin
    const isAdminEmail = cleanEmail.includes('admin') || 
                         (process.env.ADMIN_EMAILS && process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()).includes(cleanEmail));

    // Create user
    const newUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      isAdmin: !!isAdminEmail,
    });

    // Generate JWT token
    const token = signToken({ 
      id: newUser._id, 
      username: newUser.username, 
      email: newUser.email,
      isAdmin: newUser.isAdmin
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
        message: 'Registration successful',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          isAdmin: newUser.isAdmin,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'An error occurred during registration' }, { status: 500 });
  }
}
