import mongoose from 'mongoose';

// Force clear cached model to purge old schema hooks during Next.js hot-reloads
if (mongoose.models && mongoose.models.Settings) {
  delete mongoose.models.Settings;
}

const SettingsSchema = new mongoose.Schema({
  telegramLink: {
    type: String,
    default: 'https://t.me/cardvault_admin',
  },
  instagramLink: {
    type: String,
    default: 'https://instagram.com/cardvault_admin',
  },
  announcementText: {
    type: String,
    default: 'Welcome to CardVault! Verify payments via Telegram support.',
  },
  announcementActive: {
    type: Boolean,
    default: true,
  },
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
  globalDiscount: {
    type: Number,
    default: 0, // percentage discount
  },
  upiId: {
    type: String,
    default: 'mahadevtanti191@okaxis',
  },
  usdToInrRate: {
    type: Number,
    default: 83,
  }
}, {
  timestamps: true
});

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
