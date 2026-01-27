/**
 * Prisma Client Instance
 * This file exports a singleton instance of PrismaClient
 * 
 * In development, this prevents multiple instances of PrismaClient
 * from being created during hot reloading, which can exhaust database connections.
 */

import { PrismaClient } from '@prisma/client';

// Declare global type for prisma client
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a singleton instance of PrismaClient
const prisma = global.prisma || new PrismaClient();

// In development, store the instance in global to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
