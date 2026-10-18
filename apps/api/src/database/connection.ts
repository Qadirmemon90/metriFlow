import mongoose, { ClientSession } from 'mongoose';
import { config } from '../config/index.js';

let isConnected = false;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) return mongoose;

  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      autoIndex: true,
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB connected to ${conn.connection.name} (ReplicaSet: ${conn.connection.readyState === 1 ? 'Ready' : 'Not Ready'})`);
    return conn;
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[Database] MongoDB disconnected cleanly.');
}

/**
 * Executes a callback within a managed MongoDB multi-document ACID transaction.
 * Automatically commits on success and aborts/rolls back on error.
 */
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
  existingSession?: ClientSession
): Promise<T> {
  if (existingSession) {
    return fn(existingSession);
  }

  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
}
