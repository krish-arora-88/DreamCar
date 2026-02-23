import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buildClient(): PrismaClient {
  const logQueries = process.env.PRISMA_LOG_QUERIES === 'true';
  return new PrismaClient({
    log: logQueries ? ['query', 'error', 'warn'] : ['error', 'warn'],
  });
}

export const prisma = globalForPrisma.prisma || buildClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
