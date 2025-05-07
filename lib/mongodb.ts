import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Add type declaration for global mongo object
declare global {
  var mongo: {
    conn: any;
    promise: Promise<any> | null;
  } | undefined;
}

// Define cached variable after the type declaration
let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached!.promise = MongoClient.connect(MONGODB_URI!).then((client) => {
      return {
        client,
        db: client.db(),
      };
    });
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}
