import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json(
        { authenticated: false }, 
        { 
          status: 401,
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        }
      );
    }

    const user = await User.findById(userPayload.id).select('-password').lean();
    if (!user) {
      return NextResponse.json(
        { authenticated: false }, 
        { 
          status: 401,
          headers: { 'Cache-Control': 'no-store, max-age=0' }
        }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
        },
      },
      { 
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      }
    );
  } catch (error) {
    console.error('Session verify error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification' }, 
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      }
    );
  }
}
