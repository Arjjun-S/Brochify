import { PrismaClient } from "@prisma/client";

/**
 * Single PrismaClient for the whole Node process (dev HMR, Next production, serverless warm).
 * Without storing on `globalThis` in production, each import graph / lambda instance could
 * create extra clients → extra TCP connections (noisy logs; can stress connection limits).
 *
 * Note: Aiven/MySQL log lines like `Received SHUTDOWN from user <via user signal>` refer to the
 * **database process** getting an OS signal from the **hosting platform** (restart, scale-to-zero,
 * maintenance)—not something Prisma or app SQL sends.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
