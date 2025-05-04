// lib/dbConnect.ts
import mongoose from "mongoose";

const MONGODB_URI: string = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env"
  );
}

// Use a global variable to cache the connection
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Create a new connection
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  // Wait for the connection
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
