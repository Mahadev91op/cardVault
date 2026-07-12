import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload || !userPayload.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error('Fetch admin users error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PUT: Modify user details (specifically toggle admin privilege)
export async function PUT(request) {
  try {
    await dbConnect();
    const currentUser = await getUserFromRequest(request);

    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { userId, isAdmin } = await request.json();

    if (!userId || isAdmin === undefined) {
      return NextResponse.json({ success: false, error: 'User ID and isAdmin flag are required' }, { status: 400 });
    }

    // Prevent admin from demoting themselves
    if (userId === currentUser.id && !isAdmin) {
      return NextResponse.json({ success: false, error: 'You cannot revoke your own admin privileges.' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    user.isAdmin = isAdmin;
    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: `User privileges updated successfully.`,
      user: { _id: user._id, username: user.username, isAdmin: user.isAdmin }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user privileges' }, { status: 500 });
  }
}

// DELETE: Remove a user account
export async function DELETE(request) {
  try {
    await dbConnect();
    const currentUser = await getUserFromRequest(request);

    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
      return NextResponse.json({ success: false, error: 'You cannot delete your own admin account.' }, { status: 400 });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'User account deleted successfully.' }, { status: 200 });

  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
