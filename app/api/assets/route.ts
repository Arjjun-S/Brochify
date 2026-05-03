import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where = type ? { type } : {};

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: assets });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}