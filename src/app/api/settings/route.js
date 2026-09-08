import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    let settings = await Settings.findOne().lean();
    
    // Seed default settings if none exist
    if (!settings) {
      const created = await Settings.create({
        upiId: 'mahadevtanti191@okaxis'
      });
      settings = created.toObject();
    } else if (!settings.upiId) {
      settings.upiId = 'mahadevtanti191@okaxis';
    }

    return NextResponse.json({ success: true, settings }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Fetch global settings error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}
