import mongoose from 'mongoose';
import dns from 'dns';

// Force DNS resolution order to IPv4 first to prevent querySrv ECONNREFUSED issues
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // 1. Re-use existing connected Mongoose instance
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (cached.conn && cached.conn.connection && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('✅ Connected to MongoDB Atlas successfully.');
        return mongooseInstance;
      })
      .catch(async (error) => {
        console.error('❌ Primary MongoDB Atlas error:', error.message);
        cached.promise = null;

        // In cloud / production (Vercel, Render, Railway), do not attempt 127.0.0.1 fallback
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`Database connection failed: ${error.message}. Please verify Atlas Network Access / IP Whitelist.`);
        }

        const localUri = 'mongodb://127.0.0.1:27017/cardvault';
        console.log(`⚠️ Attempting fast fallback to local database: ${localUri}...`);
        
        try {
          await mongoose.disconnect().catch(() => {});
          const localInstance = await mongoose.connect(localUri, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 3000,
          });
          console.log('✅ Successfully connected to local MongoDB fallback.');
          return localInstance;
        } catch (localError) {
          console.error('❌ Local MongoDB fallback failed:', localError.message);
          throw new Error(`Database connection failed: ${error.message}`);
        }
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

