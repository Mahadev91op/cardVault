import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Card from '@/models/Card';

// Default premium cards to seed if DB is empty
const defaultCards = [
  // Visa Cards
  {
    type: 'visa',
    name: 'Visa Platinum Elite',
    cardNumber: '4532 7812 9045 8823',
    cvv: '942',
    cardHolder: 'ELITE MEMBER',
    limit: '$1,500 / month',
    expiry: '12/28',
    refund: '100% Refundable',
    delivery: 'Instant Delivery',
    entryFee: 15,
    qty: 48,
    gradientStart: '#1e3c72',
    gradientEnd: '#2a5298'
  },
  {
    type: 'visa',
    name: 'Visa Virtual Basic',
    cardNumber: '4111 2289 7761 0429',
    cvv: '108',
    cardHolder: 'VALUED USER',
    limit: '$100 / month',
    expiry: '05/27',
    refund: 'Non-Refundable',
    delivery: 'Within 5 Mins',
    entryFee: 5,
    qty: 120,
    gradientStart: '#00c6ff',
    gradientEnd: '#0072ff'
  },
  {
    type: 'visa',
    name: 'Visa Premium AdCard',
    cardNumber: '4890 1256 3489 7710',
    cvv: '354',
    cardHolder: 'AD MANAGER',
    limit: '$5,00,0 / month', // Clean format
    expiry: '09/27',
    refund: 'Refundable (90%)',
    delivery: 'Instant Delivery',
    entryFee: 29,
    qty: 15,
    gradientStart: '#8a2be2',
    gradientEnd: '#4a0e4e'
  },
  
  // Mastercard Cards
  {
    type: 'mastercard',
    name: 'Mastercard World Elite',
    cardNumber: '5412 7589 1234 5678',
    cvv: '012',
    cardHolder: 'WORLD TRAVELER',
    limit: '$10,000 / month',
    expiry: '08/30',
    refund: '100% Refundable',
    delivery: 'Instant Delivery',
    entryFee: 49,
    qty: 12,
    gradientStart: '#f857a6',
    gradientEnd: '#ff5858'
  },
  {
    type: 'mastercard',
    name: 'Mastercard Virtual Plus',
    cardNumber: '5224 8890 0122 4589',
    cvv: '877',
    cardHolder: 'ONLINE SHOPPER',
    limit: '$500 / month',
    expiry: '03/28',
    refund: '100% Refundable',
    delivery: 'Instant Delivery',
    entryFee: 10,
    qty: 85,
    gradientStart: '#ff9966',
    gradientEnd: '#ff5e62'
  },
  {
    type: 'mastercard',
    name: 'Mastercard Ultra Premium',
    cardNumber: '5561 0233 4872 9011',
    cvv: '445',
    cardHolder: 'ULTRA MEMBER',
    limit: '$2,500 / month',
    expiry: '10/28',
    refund: '100% Refundable',
    delivery: 'Instant Delivery',
    entryFee: 20,
    qty: 34,
    gradientStart: '#11998e',
    gradientEnd: '#38ef7d'
  },

  // Rupay Cards
  {
    type: 'rupay',
    name: 'Rupay Platinum Global',
    cardNumber: '6071 5289 1012 3456',
    cvv: '990',
    cardHolder: 'GLOBAL PAYER',
    limit: '₹1,00,000 / month',
    expiry: '06/28',
    refund: '100% Refundable',
    delivery: 'Instant Delivery',
    entryFee: 12,
    qty: 50,
    gradientStart: '#3a7bd5',
    gradientEnd: '#3a6073'
  },
  {
    type: 'rupay',
    name: 'Rupay Classic Digital',
    cardNumber: '6521 8890 1204 7712',
    cvv: '221',
    cardHolder: 'DIGITAL USER',
    limit: '₹20,000 / month',
    expiry: '11/26',
    refund: 'Non-Refundable',
    delivery: 'Within 5 Mins',
    entryFee: 4,
    qty: 150,
    gradientStart: '#43c6ac',
    gradientEnd: '#191654'
  },
  {
    type: 'rupay',
    name: 'Rupay Premium Biz',
    cardNumber: '6082 1100 4567 8901',
    cvv: '667',
    cardHolder: 'BUSINESS PRO',
    limit: '₹5,00,000 / month',
    expiry: '04/28',
    refund: 'Refundable (95%)',
    delivery: 'Instant Delivery',
    entryFee: 18,
    qty: 25,
    gradientStart: '#e65c00',
    gradientEnd: '#f9d423'
  }
];

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Upgrade check: If cards has old expiry format (like '3 Years Expiry'), reseed database
    const cardCount = await Card.countDocuments();
    const hasOldExpiry = await Card.findOne({ expiry: /Expiry/i });
    
    if (cardCount === 0 || hasOldExpiry) {
      console.log('Upgrading default cards database with formatted exspiries (MM/YY)...');
      await Card.deleteMany({});
      await Card.insertMany(defaultCards);
    }

    const query = type ? { type } : {};
    const cards = await Card.find(query);

    return NextResponse.json({ success: true, cards }, { status: 200 });
  } catch (error) {
    console.error('Cards fetch error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch cards' }, { status: 500 });
  }
}

// POST endpoint to add a new custom card if needed
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    const newCard = await Card.create(body);

    return NextResponse.json({ success: true, card: newCard }, { status: 201 });
  } catch (error) {
    console.error('Card create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create card' }, { status: 500 });
  }
}
