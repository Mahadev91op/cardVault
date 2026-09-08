import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request) {
  try {
    await dbConnect();
    const { username, email, newPassword } = await request.json();

    if (!username || !email || !newPassword) {
      return NextResponse.json(
        { error: 'Username, registered email, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find user matching username and email with clear diagnosis
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const safeRegex = trimmedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const userByUsername = await User.findOne({
      username: { $regex: new RegExp(`^${safeRegex}$`, 'i') },
    });

    if (!userByUsername) {
      return NextResponse.json(
        { error: `No registered account found with username "${trimmedUsername}". Please check spelling.` },
        { status: 404 }
      );
    }

    if (userByUsername.email.toLowerCase() !== trimmedEmail) {
      return NextResponse.json(
        { error: `The email "${trimmedEmail}" does not match the registered email for user "${userByUsername.username}".` },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userByUsername.password = hashedPassword;
    await userByUsername.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Your password has been successfully reset. You can now sign in with your new password.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting password. Please try again.' },
      { status: 500 }
    );
  }
}
