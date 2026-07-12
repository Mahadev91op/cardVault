import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Card from '@/models/Card';
import { getUserFromRequest } from '@/lib/auth';

// GET: Fetch user's orders
export async function GET(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Find orders and populate Card details
    const orders = await Order.find({ userId: userPayload.id })
      .populate('cardId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST: Create a new order (Buy Card)
export async function POST(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload) {
      return NextResponse.json({ success: false, error: 'Please log in to purchase cards' }, { status: 401 });
    }

    const { cardId, utrNumber } = await request.json();

    if (!cardId) {
      return NextResponse.json({ success: false, error: 'Card ID is required' }, { status: 400 });
    }

    if (!utrNumber || utrNumber.trim() === '') {
      return NextResponse.json({ success: false, error: 'UPI Transaction UTR / Ref Number is required' }, { status: 400 });
    }

    const cleanUtr = utrNumber.replace(/\s+/g, '');
    
    // Check length and numeric pattern (exactly 12 digits)
    if (!/^\d{12}$/.test(cleanUtr)) {
      return NextResponse.json({ success: false, error: 'Invalid UTR format. Must be exactly 12 numeric digits.' }, { status: 400 });
    }

    // Check year code (first digit matches calendar year last digit, e.g., 6 for 2026)
    const currentYearLastDigit = new Date().getFullYear().toString().slice(-1);
    if (cleanUtr[0] !== currentYearLastDigit) {
      return NextResponse.json({ success: false, error: `Invalid UTR. For transactions in ${new Date().getFullYear()}, the Ref No. must start with the digit ${currentYearLastDigit}.` }, { status: 400 });
    }

    // Check if this UTR has already been submitted to prevent duplicate entries
    const duplicateUtr = await Order.findOne({ utrNumber: cleanUtr });
    if (duplicateUtr) {
      return NextResponse.json({ success: false, error: 'This UTR reference number has already been used for another purchase request.' }, { status: 400 });
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

    // Decrement card quantity
    card.qty -= 1;
    await card.save();

    // Create a random mock real card details to be released after admin verification
    // This is useful so the system has the actual virtual card number, CVV, expiry ready for completed status
    const randomCardNum = card.cardNumber.split(' ').map((part, index) => {
      if (index === 1 || index === 2) {
        return Math.floor(1000 + Math.random() * 9000).toString(); // replace asterisks/placeholders with real numbers
      }
      return part;
    }).join(' ');

    const newOrder = await Order.create({
      userId: userPayload.id,
      cardId: card._id,
      status: 'pending',
      pricePaid: card.entryFee,
      utrNumber: cleanUtr,
      releasedCardDetails: {
        number: randomCardNum,
        expiry: card.type === 'rupay' ? '12/30' : '08/30',
        cvv: Math.floor(100 + Math.random() * 900).toString(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Order created successfully. Please verify payment to activate.',
      order: newOrder
    }, { status: 201 });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
