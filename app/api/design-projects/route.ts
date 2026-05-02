import { NextRequest, NextResponse } from "next/server";
import { requireServerSession } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    const session = await requireServerSession();

    const projects = await prisma.designProject.findMany({
      where: { createdBy: session.userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        width: true,
        height: true,
        thumbnailUrl: true,
        isTemplate: true,
        isPro: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: projects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireServerSession();
    const body = await request.json();
    const { name, json, width, height } = body;

    const project = await prisma.designProject.create({
      data: {
        name: name || "Untitled project",
        json: json || "",
        width: width || 900,
        height: height || 1200,
        createdBy: session.userId,
      },
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 500 },
    );
  }
}
