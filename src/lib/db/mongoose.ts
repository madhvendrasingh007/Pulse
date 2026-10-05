import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalCache = globalThis as typeof globalThis & { __pulseMongoose?: MongooseCache };
const cache = globalCache.__pulseMongoose ?? { conn: null, promise: null };
globalCache.__pulseMongoose = cache;

/** Call from server-only route handlers. Missing local credentials are intentionally supported. */
export async function connectMongo() {
  if (!uri) throw new Error("MONGODB_URI is not configured.");
  if (cache.conn) return cache.conn;
  if (!cache.promise) cache.promise = mongoose.connect(uri).then((db) => db).catch((error) => { cache.promise = null; throw error; });
  cache.conn = await cache.promise;
  return cache.conn;
}
