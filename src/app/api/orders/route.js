import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Card from '@/models/Card';
import { getUserFromRequest } from '@/lib/auth';

import { validateUtrNumber } from '@/lib/utrValidator';
import { sendOrderNotificationEmail } from '@/lib/emailService';

export const dynamic = 'force-dynamic';

// GET: Fetch user's orders
export async function GET(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Find orders and populate Card details
    const rawOrders = await Order.find({ userId: userPayload.id })
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
    console.error('Fetch orders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST: Create a new order (Buy Card with Anti-Fraud Validation)
export async function POST(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json({ success: false, error: 'Please log in to purchase cards' }, { status: 401 });
    }

    const { cardId, utrNumber, senderUpiId, paymentApp, paymentScreenshot } = await request.json();

    if (!cardId) {
      return NextResponse.json({ success: false, error: 'Card ID is required' }, { status: 400 });
    }

    // 1. Anti-Spam Check: Max 2 pending orders per user
    const pendingOrdersCount = await Order.countDocuments({
      userId: userPayload.id,
      status: 'pending',
    });

    if (pendingOrdersCount >= 2) {
      return NextResponse.json({
        success: false,
        error: 'You already have 2 pending verification orders. Please wait for Admin approval before submitting another purchase.',
      }, { status: 400 });
    }

    // 2. Strict NPCI-compliant UTR Validation Engine
    const utrResult = validateUtrNumber(utrNumber);
    if (!utrResult.isValid) {
      return NextResponse.json({ success: false, error: utrResult.error }, { status: 400 });
    }
    const cleanUtr = utrResult.cleanUtr;

    // 3. Sender Verification: Require Sender UPI ID / Phone number
    const trimmedSender = (senderUpiId || '').trim();
    if (!trimmedSender || trimmedSender.length < 4) {
      return NextResponse.json({
        success: false,
        error: 'Please provide a valid Sender UPI ID or Phone number for payment verification.',
      }, { status: 400 });
    }

    // 4. Payment Screenshot Proof Validation
    if (!paymentScreenshot || typeof paymentScreenshot !== 'string' || !paymentScreenshot.startsWith('data:image/')) {
      return NextResponse.json({
        success: false,
        error: 'A valid payment screenshot or receipt image is mandatory to prevent fraud.',
      }, { status: 400 });
    }

    // Check screenshot payload size (limit to ~4MB base64)
    if (paymentScreenshot.length > 5 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'Payment screenshot image is too large. Please upload an image under 4MB.',
      }, { status: 400 });
    }

    // 5. Global Duplicate UTR Check (reject if used anywhere)
    const duplicateUtr = await Order.findOne({ utrNumber: cleanUtr });
    if (duplicateUtr) {
      return NextResponse.json({
        success: false,
        error: 'This UPI UTR reference number has already been recorded in the system. Duplicate submissions are strictly rejected.',
      }, { status: 400 });
    }

    // Verify card exists and is in stock
    const card = await Card.findById(cardId);
    if (!card) {
      return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
    }

    if (card.qty <= 0) {
      return NextResponse.json({ success: false, error: 'Card is out of stock' }, { status: 400 });
    }

    // Prevent duplicate purchases of the same card by the same user (pending or completed)
    const existingOrder = await Order.findOne({
      userId: userPayload.id,
      cardId: card._id,
      status: { $in: ['pending', 'completed'] }
    });

    if (existingOrder) {
      const errorMsg = existingOrder.status === 'completed'
        ? 'You have already purchased this card. Check "My Orders" for details.'
        : 'You already have a pending order for this card. Please verify payment.';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    // Decrement card quantity atomically
    await Card.findByIdAndUpdate(card._id, { $inc: { qty: -1 } });

    // Create a random mock real card details to be released after admin verification
    const rawCardNum = card.cardNumber || '4532 8921 4432 9901';
    const randomCardNum = rawCardNum.split(' ').map((part, index) => {
      if (index === 1 || index === 2) {
        return Math.floor(1000 + Math.random() * 9000).toString();
      }
      return part;
    }).join(' ');

    const newOrder = await Order.create({
      userId: userPayload.id,
      cardId: card._id,
      status: 'pending',
      pricePaid: card.entryFee,
      utrNumber: cleanUtr,
      senderUpiId: trimmedSender,
      paymentApp: paymentApp || 'other',
      paymentScreenshot: paymentScreenshot,
      releasedCardDetails: {
        number: randomCardNum,
        expiry: card.expiry || (card.type === 'rupay' ? '12/30' : '08/30'),
        cvv: card.cvv && card.cvv !== '***' ? card.cvv : Math.floor(100 + Math.random() * 900).toString(),
        cardHolder: card.cardHolder || userPayload.username.toUpperCase(),
        dob: card.dob || '15/07/1994',
        atmPin: card.atmPin || Math.floor(1000 + Math.random() * 9000).toString(),
      },
      cardSnapshot: {
        name: card.name,
        type: card.type,
        limit: card.limit,
        cardNumber: card.cardNumber,
        expiry: card.expiry,
        cvv: card.cvv,
        cardHolder: card.cardHolder || userPayload.username.toUpperCase(),
        dob: card.dob || '15/07/1994',
        atmPin: card.atmPin || '1234',
        entryFee: card.entryFee,
        gradientStart: card.gradientStart,
        gradientEnd: card.gradientEnd,
      }
    });

    // Send email notification to Admin asynchronously (fire & log)
    sendOrderNotificationEmail({
      order: newOrder,
      buyer: { username: userPayload.username, email: userPayload.email },
      card: { name: card.name, type: card.type, entryFee: card.entryFee }
    }).catch(err => console.error('Admin order notification email failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Order created successfully. Please verify payment to activate.',
      order: newOrder
    }, { status: 201 });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to create order' 
    }, { status: 500 });
  }
}
