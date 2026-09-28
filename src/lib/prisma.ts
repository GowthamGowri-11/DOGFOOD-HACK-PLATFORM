import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Avoid flooding the terminal with every SQL statement (looks like errors).
    // Set PRISMA_LOG_QUERIES=true if you need query-level debugging.
    log:
      process.env.PRISMA_LOG_QUERIES === 'true'
        ? ['query', 'error', 'warn']
        : process.env.NODE_ENV === 'development'
          ? ['error', 'warn']
          : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
