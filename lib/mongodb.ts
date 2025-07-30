import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

declare global {
  var mongo: { conn: MongoClient | null; promise: Promise<MongoClient> | null };
}

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {};

    cached.promise = MongoClient.connect(MONGODB_URI!, opts).then((client) => {
      return client;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
