import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  pricePaid: {
    type: Number,
    required: true,
  },
  utrNumber: {
    type: String,
    default: '',
    trim: true,
  },
  senderUpiId: {
    type: String,
    default: '',
    trim: true,
  },
  paymentApp: {
    type: String,
    enum: ['phonepe', 'gpay', 'paytm', 'bhim', 'other', ''],
    default: 'other',
  },
  paymentScreenshot: {
    type: String, // Base64 Data URL
    default: '',
  },
  rejectionReason: {
    type: String,
    default: '',
    trim: true,
  },
  releasedCardDetails: {
    number: String,
    expiry: String,
    cvv: String,
    cardHolder: String,
    dob: String,
    atmPin: String,
  },
  cardSnapshot: {
    name: String,
    type: String,
    limit: String,
    cardNumber: String,
    expiry: String,
    cvv: String,
    cardHolder: String,
    dob: String,
    atmPin: String,
    entryFee: Number,
    gradientStart: String,
    gradientEnd: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
