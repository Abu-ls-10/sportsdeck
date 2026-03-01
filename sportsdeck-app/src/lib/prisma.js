// @ts-check

import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis;

// @ts-ignore
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  // @ts-ignore
  globalForPrisma.prisma = prisma
}