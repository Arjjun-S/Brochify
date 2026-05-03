import { Prisma } from "@prisma/client";

/** True when Prisma cannot reach MySQL (VPN down, wrong DATABASE_URL, Aiven asleep, etc.). */
export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "P1000";
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    return /Can't reach database server|P1001|ECONNREFUSED|ENOTFOUND/i.test(error.message);
  }

  return false;
}
