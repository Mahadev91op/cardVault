import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Card from '@/models/Card';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';
import { sendOrderApprovedEmail, sendOrderRejectedEmail } from '@/lib/emailService';

// GET: Fetch all orders for administration
export async function GET(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload || !userPayload.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const rawOrders = await Order.find({})
      .populate('userId', 'username email')
      .populate('cardId')
      .sort({ createdAt: -1 })
      .lean();

    const orders = rawOrders.map(order => {
      if (!order.cardId && order.cardSnapshot) {
        return {
          ...order,
          cardId: {
            _id: order.cardSnapshot._id || ('snapshot-' + order._id),
            ...order.cardSnapshot
          }
        };
      }
      return order;
    });

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

    const { orderId, status, releasedCardDetails, rejectionReason } = await request.json();

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
    
    // If completing the order, set the released card details (all 7 factors)
    if (status === 'completed' && releasedCardDetails) {
      order.releasedCardDetails = {
        number: releasedCardDetails.number,
        expiry: releasedCardDetails.expiry,
        cvv: releasedCardDetails.cvv,
        cardHolder: releasedCardDetails.cardHolder || order.releasedCardDetails?.cardHolder || 'CARDHOLDER',
        dob: releasedCardDetails.dob || order.releasedCardDetails?.dob || '15/07/1994',
        atmPin: releasedCardDetails.atmPin || order.releasedCardDetails?.atmPin || '1234',
      };
      order.rejectionReason = '';
    } else if (status === 'failed') {
      order.rejectionReason = rejectionReason || 'Payment verification failed: UTR/payment not found in bank account.';
    }
    
    await order.save();

    // Trigger buyer email notification asynchronously (fire & log)
    Order.findById(orderId)
      .populate('userId', 'username email')
      .populate('cardId')
      .then((populatedOrder) => {
        if (!populatedOrder || !populatedOrder.userId) return;
        if (status === 'completed') {
          sendOrderApprovedEmail({
            order: populatedOrder,
            buyer: populatedOrder.userId,
            card: populatedOrder.cardId,
            releasedCardDetails: populatedOrder.releasedCardDetails,
          }).catch((err) => console.error('Buyer approval email dispatch failed:', err));
        } else if (status === 'failed') {
          sendOrderRejectedEmail({
            order: populatedOrder,
            buyer: populatedOrder.userId,
            card: populatedOrder.cardId,
            rejectionReason: populatedOrder.rejectionReason,
          }).catch((err) => console.error('Buyer rejection email dispatch failed:', err));
        }
      })
      .catch((err) => console.error('Populating order for email notification failed:', err));

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
