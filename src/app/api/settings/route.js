import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne();
    
    // Seed default settings if none exist
    if (!settings) {
      settings = await Settings.create({});
    } else {
      // Guarantee exactly one configuration document in the collection
      await Settings.deleteMany({ _id: { $ne: settings._id } });
    }

    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error) {
    console.error('Fetch global settings error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}
