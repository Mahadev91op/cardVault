import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Card from '@/models/Card';
import { getUserFromRequest } from '@/lib/auth';

// POST: Add new card to marketplace
export async function POST(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload || !userPayload.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { type, name, cardNumber, cvv, cardHolder, limit, expiry, refund, delivery, entryFee, qty, gradientStart, gradientEnd } = body;

    if (!type || !name || !cardNumber || !limit || !expiry || !entryFee) {
      return NextResponse.json({ success: false, error: 'Missing required card fields' }, { status: 400 });
    }

    const newCard = await Card.create({
      type,
      name,
      cardNumber,
      cvv: cvv || '***',
      cardHolder: cardHolder || 'CARDHOLDER',
      limit,
      expiry,
      refund: refund || '100% Refundable',
      delivery: delivery || 'Instant Delivery',
      entryFee: Number(entryFee),
      qty: Number(qty) || 10,
      gradientStart: gradientStart || '#1e3c72',
      gradientEnd: gradientEnd || '#2a5298',
    });

    return NextResponse.json({ success: true, message: 'Card added successfully', card: newCard }, { status: 201 });
  } catch (error) {
    console.error('Admin create card error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create card' }, { status: 500 });
  }
}

// PUT: Edit existing card
export async function PUT(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload || !userPayload.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { cardId, ...updateData } = body;

    if (!cardId) {
      return NextResponse.json({ success: false, error: 'Card ID is required' }, { status: 400 });
    }

    const card = await Card.findById(cardId);
    if (!card) {
      return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
    }

    // Update fields
    const allowedUpdates = [
      'type', 'name', 'cardNumber', 'cvv', 'cardHolder', 
      'limit', 'expiry', 'refund', 'delivery', 'entryFee', 
      'qty', 'gradientStart', 'gradientEnd'
    ];

    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'entryFee' || field === 'qty') {
          card[field] = Number(updateData[field]);
        } else {
          card[field] = updateData[field];
        }
      }
    });

    await card.save();

    return NextResponse.json({ success: true, message: 'Card updated successfully', card }, { status: 200 });
  } catch (error) {
    console.error('Admin update card error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update card' }, { status: 500 });
  }
}

// DELETE: Remove card from marketplace
export async function DELETE(request) {
  try {
    await dbConnect();
    const userPayload = await getUserFromRequest(request);

    if (!userPayload || !userPayload.isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return NextResponse.json({ success: false, error: 'Card ID is required' }, { status: 400 });
    }

    const card = await Card.findByIdAndDelete(cardId);
    if (!card) {
      return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Card deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Admin delete card error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete card' }, { status: 500 });
  }
}
