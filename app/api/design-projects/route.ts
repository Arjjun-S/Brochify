import { NextRequest, NextResponse } from "next/server";
import { requireServerSession } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function isBrochureLinkingUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message;
  return (
    message.includes("Unknown argument `brochureId`")
    || message.includes("Unknown arg `brochureId`")
    || message.includes("Unknown column") && message.includes("brochure_id")
    || message.includes("column `brochure_id` does not exist")
  );
}

export async function GET() {
  try {
    const session = await requireServerSession();

    let projects: Array<{
      id: number;
      name: string;
      width: number;
      height: number;
      thumbnailUrl: string | null;
      isTemplate: boolean;
      isPro: boolean;
      brochureId: number | null;
      createdAt: Date;
      updatedAt: Date;
    }>;

    try {
      const linkedProjects = await prisma.designProject.findMany({
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
          brochureId: true,
          createdAt: true,
          updatedAt: true,
        },
      } as never) as Array<{
        id: number;
        name: string;
        width: number;
        height: number;
        thumbnailUrl: string | null;
        isTemplate: boolean;
        isPro: boolean;
        brochureId?: number | null;
        createdAt: Date;
        updatedAt: Date;
      }>;

      projects = linkedProjects.map((project) => ({
        ...project,
        brochureId: project.brochureId ?? null,
      }));
    } catch (error) {
      if (!isBrochureLinkingUnavailable(error)) {
        throw error;
      }

      const fallbackProjects = await prisma.designProject.findMany({
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

      projects = fallbackProjects.map((project) => ({
        ...project,
        brochureId: null,
      }));
    }

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
    const { name, json, width, height, brochureId } = body;

    let linkedBrochureId: number | undefined;
    if (typeof brochureId === "number" && Number.isFinite(brochureId) && brochureId > 0) {
      const linkedBrochure = await prisma.brochure.findFirst({
        where: {
          id: brochureId,
          OR: [
            { createdBy: session.userId },
            { assignedAdminId: session.userId },
          ],
        },
        select: { id: true },
      });

      if (!linkedBrochure) {
        return NextResponse.json({ error: "Brochure not found" }, { status: 404 });
      }

      linkedBrochureId = linkedBrochure.id;
    }

    const baseData = {
      name: name || "Untitled project",
      json: json || "",
      width: width || 900,
      height: height || 1200,
      createdBy: session.userId,
    };

    let project;
    if (linkedBrochureId !== undefined) {
      try {
        project = await prisma.designProject.create({
          data: {
            ...baseData,
            brochureId: linkedBrochureId,
          },
        } as never);
      } catch (error) {
        if (!isBrochureLinkingUnavailable(error)) {
          throw error;
        }

        project = await prisma.designProject.create({
          data: baseData,
        });
      }
    } else {
      project = await prisma.designProject.create({
        data: baseData,
      });
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 500 },
    );
  }
}
