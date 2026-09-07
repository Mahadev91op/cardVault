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

    // Find user matching both username and email (case-insensitive for email, trim both)
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') },
      email: trimmedEmail,
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found matching this username and email combination' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

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
