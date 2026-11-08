import { PrismaClient } from '@prisma/client';
import { config } from '../config';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances in development (hot reload)
export const prisma: PrismaClient =
  global.__prisma ||
  new PrismaClient({
    log: config.isTest
      ? []
      : config.nodeEnv === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

/**
 * Standard configuration for interactive transactions across the application.
 * Prevents P2028 / timeout failures over network latency to cloud databases (Supabase Tokyo pooler).
 */
export const TX_DEFAULT_OPTIONS = {
  maxWait: 20000, // 20s waiting to acquire a connection
  timeout: 60000, // 60s interactive transaction timeout
};

if (config.nodeEnv !== 'production' || process.env.VERCEL) {
  global.__prisma = prisma;
}
