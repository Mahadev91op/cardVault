import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { getUserFromRequest } from '@/lib/auth';

// GET: Fetch all orders for administration
export async function GET(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload || !userPayload.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const orders = await Order.find({})
      .populate('userId', 'username email')
      .populate('cardId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (error) {
    console.error('Admin fetch orders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// PUT: Approve / Reject payment request order
export async function PUT(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload || !userPayload.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { orderId, status, releasedCardDetails } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: 'Order ID and status are required' }, { status: 400 });
    }

    if (!['completed', 'failed'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status (completed or failed only)' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    order.status = status;
    
    // If completing the order, set the released card details
    if (status === 'completed' && releasedCardDetails) {
      order.releasedCardDetails = {
        number: releasedCardDetails.number,
        expiry: releasedCardDetails.expiry,
        cvv: releasedCardDetails.cvv,
      };
    }
    
    await order.save();

    return NextResponse.json({ 
      success: true, 
      message: `Order status updated to ${status} successfully.`,
      order 
    }, { status: 200 });

  } catch (error) {
    console.error('Admin update order error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
