import mongoose from 'mongoose';
import dns from 'dns';

// Force DNS resolution order to IPv4 first to prevent querySrv ECONNREFUSED on Windows
if (process.platform === 'win32' && dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Set DNS servers to Google and Cloudflare DNS to avoid querySrv ECONNREFUSED issues on local Windows networks
if (process.platform === 'win32' && process.env.NODE_ENV === 'development') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    console.warn('Failed to set custom DNS servers:', err);
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout before fallback
    };

    console.log(`Connecting to primary database...`);

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('✅ Successfully connected to primary MongoDB database.');
        return mongooseInstance;
      })
      .catch(async (error) => {
        console.error('❌ Primary MongoDB connection error:', error.message);
        
        const localUri = 'mongodb://127.0.0.1:27017/cardvault';
        console.log(`⚠️ Attempting fallback to local database: ${localUri}...`);
        console.log('💡 TIP: If you want to use MongoDB Atlas, ensure your IP address is whitelisted in Network Access on the Atlas dashboard.');
        
        try {
          const localInstance = await mongoose.connect(localUri, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
          });
          console.log('✅ Successfully connected to local MongoDB fallback.');
          return localInstance;
        } catch (localError) {
          console.error('❌ Local MongoDB fallback also failed:', localError.message);
          throw new Error(`Database connection failed. Primary: ${error.message}. Fallback: ${localError.message}`);
        }
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
