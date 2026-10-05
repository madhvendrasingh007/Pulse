import { createHmac } from "node:crypto";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/db/mongoose";

const MAX_ATTEMPTS = 6;
const WINDOW_MS = 15 * 60 * 1000;
let indexesReady: Promise<unknown> | undefined;

function clientAddress(request: Request) {
  return request.headers.get("x-nf-client-connection-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

export async function consumeLoginAttempt(request: Request) {
  await connectMongo();
  const collection = mongoose.connection.getClient().db().collection("pulse_login_limits");
  indexesReady ??= Promise.all([
    collection.createIndex({ key: 1 }, { unique: true }),
    collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  await indexesReady;
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured.");
  const key = createHmac("sha256", secret).update(clientAddress(request)).digest("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + WINDOW_MS);
  await collection.updateOne({ key }, [{ $set: {
    attempts: { $cond: [{ $gt: ["$expiresAt", now] }, { $min: [{ $add: [{ $ifNull: ["$attempts", 0] }, 1] }, MAX_ATTEMPTS] }, 1] },
    expiresAt: { $cond: [{ $gt: ["$expiresAt", now] }, "$expiresAt", expiresAt] },
  } }], { upsert: true });
  const record = await collection.findOne({ key });
  return { key, blocked: Number(record?.attempts ?? MAX_ATTEMPTS) > MAX_ATTEMPTS - 1 };
}

export async function clearLoginAttempts(key: string) {
  await connectMongo();
  await mongoose.connection.getClient().db().collection("pulse_login_limits").deleteOne({ key });
}
