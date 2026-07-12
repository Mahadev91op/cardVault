import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';
import { getUserFromRequest } from '@/lib/auth';

// PUT: Update site global settings (Admin only)
export async function PUT(request) {
  try {
    await dbConnect();
    const currentUser = await getUserFromRequest(request);

    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    let settings = await Settings.findOne();
    
    // Seed default settings if none exist
    if (!settings) {
      settings = await Settings.create({});
    } else {
      // Guarantee exactly one configuration document in the collection
      await Settings.deleteMany({ _id: { $ne: settings._id } });
    }

    const allowedFields = [
      'telegramLink',
      'instagramLink',
      'announcementText',
      'announcementActive',
      'maintenanceMode',
      'globalDiscount'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'globalDiscount') {
          settings[field] = Number(body[field]);
        } else if (field === 'announcementActive' || field === 'maintenanceMode') {
          settings[field] = body[field] === true || body[field] === 'true';
        } else {
          settings[field] = body[field];
        }
      }
    });

    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Global configurations updated successfully.',
      settings
    }, { status: 200 });

  } catch (error) {
    console.error('Admin settings update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update global configurations' }, { status: 500 });
  }
}
