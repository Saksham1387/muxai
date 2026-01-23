/**
 * Instantiates a single instance PrismaClient and save it on the global object.
 * @see https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  })

const prismaGlobal = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  prismaGlobal.prisma ??
  new PrismaClient({
    adapter
  });

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma;
}