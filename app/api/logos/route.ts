import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      where: { type: "logo" },
      orderBy: { createdAt: "asc" },
    });

    const logos = assets.map((asset) => ({
      id: String(asset.id),
      name: asset.name.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      src: asset.cloudinaryUrl,
    }));

    return NextResponse.json({ logos });
  } catch (error) {
    return NextResponse.json(
      {
        logos: [],
        error: error instanceof Error ? error.message : "Unable to load logo library.",
      },
      { status: 500 },
    );
  }
}
