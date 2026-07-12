import mongoose from 'mongoose';

const CardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['visa', 'mastercard', 'rupay'],
    required: [true, 'Card type is required (visa, mastercard, rupay)'],
  },
  name: {
    type: String,
    required: [true, 'Card name is required'],
  },
  cardNumber: {
    type: String,
    required: [true, 'Card number representation is required'],
  },
  cvv: {
    type: String,
    default: '***',
  },
  cardHolder: {
    type: String,
    default: 'CARDHOLDER',
  },
  limit: {
    type: String,
    required: [true, 'Card spending limit is required'],
  },
  expiry: {
    type: String,
    required: [true, 'Card expiry is required'],
  },
  refund: {
    type: String,
    default: '100% Refundable',
  },
  delivery: {
    type: String,
    default: 'Instant Delivery',
  },
  entryFee: {
    type: Number,
    required: [true, 'Entry fee (price) is required'],
  },
  qty: {
    type: Number,
    required: [true, 'Quantity in stock is required'],
    default: 10,
  },
  gradientStart: {
    type: String,
    default: '#1e3c72',
  },
  gradientEnd: {
    type: String,
    default: '#2a5298',
  },
});

export default mongoose.models.Card || mongoose.model('Card', CardSchema);
