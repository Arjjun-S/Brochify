import { NextRequest, NextResponse } from "next/server";
import { requireServerSession } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function isBrochureLinkingUnavailable(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message;
  return (
    message.includes("Unknown argument `brochure`")
    || message.includes("Unknown arg `brochure`")
    || message.includes("Unknown argument `brochureId`")
    || message.includes("Unknown arg `brochureId`")
    || message.includes("Unknown column") && message.includes("brochure_id")
    || message.includes("column `brochure_id` does not exist")
  );
}

type LinkedProject = {
  id: number;
  name: string;
  json: string;
  width: number;
  height: number;
  thumbnailUrl: string | null;
  isTemplate: boolean;
  isPro: boolean;
  brochureId: number | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  brochure: {
    id?: number;
    createdBy: number;
    assignedAdminId: number;
    status?: string;
    rejectionReason?: string | null;
    content?: unknown;
  } | null;
};

function hasLinkedBrochureAccess(
  sessionUserId: number,
  brochure:
    | {
        createdBy: number;
        assignedAdminId: number;
      }
    | null
) {
  if (!brochure) {
    return false;
  }

  return (
    brochure.createdBy === sessionUserId ||
    brochure.assignedAdminId === sessionUserId
  );
}

function extractTemplateFromContent(content: unknown): string | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return null;
  }

  const templateValue = (content as { template?: unknown }).template;
  return typeof templateValue === "string" ? templateValue : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireServerSession();
    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    let project: LinkedProject | null;

    try {
      project = await prisma.designProject.findUnique({
        where: { id: projectId },
        include: {
          brochure: {
            select: {
              id: true,
              createdBy: true,
              assignedAdminId: true,
              status: true,
              rejectionReason: true,
              content: true,
            },
          },
        },
      } as never) as LinkedProject | null;
    } catch (error) {
      if (!isBrochureLinkingUnavailable(error)) {
        throw error;
      }

      const fallbackProject = await prisma.designProject.findFirst({
        where: {
          id: projectId,
          OR: [
            { createdBy: session.userId },
            { isTemplate: true },
          ],
        },
      });

      if (!fallbackProject) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      return NextResponse.json({
        data: {
          id: fallbackProject.id,
          name: fallbackProject.name,
          json: fallbackProject.json,
          width: fallbackProject.width,
          height: fallbackProject.height,
          thumbnailUrl: fallbackProject.thumbnailUrl,
          isTemplate: fallbackProject.isTemplate,
          isPro: fallbackProject.isPro,
          brochureId: null,
          reviewStatus: null,
          rejectionReason: null,
          brochureTemplate: null,
          createdAt: fallbackProject.createdAt,
          updatedAt: fallbackProject.updatedAt,
        },
      });
    }

    const canAccess =
      !!project &&
      (project.isTemplate ||
        project.createdBy === session.userId ||
        hasLinkedBrochureAccess(session.userId, project.brochure));

    if (!canAccess || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: project.id,
        name: project.name,
        json: project.json,
        width: project.width,
        height: project.height,
        thumbnailUrl: project.thumbnailUrl,
        isTemplate: project.isTemplate,
        isPro: project.isPro,
        brochureId: project.brochureId,
        reviewStatus: project.brochure?.status ?? null,
        rejectionReason: project.brochure?.rejectionReason ?? null,
        brochureTemplate: extractTemplateFromContent(project.brochure?.content),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireServerSession();
    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    let existing: LinkedProject | null;
    let canEdit: boolean;

    try {
      existing = await prisma.designProject.findUnique({
        where: { id: projectId },
        include: {
          brochure: {
            select: {
              createdBy: true,
              assignedAdminId: true,
            },
          },
        },
      } as never) as LinkedProject | null;

      canEdit =
        !!existing &&
        (existing.createdBy === session.userId ||
          hasLinkedBrochureAccess(session.userId, existing.brochure));
    } catch (error) {
      if (!isBrochureLinkingUnavailable(error)) {
        throw error;
      }

      const fallbackExisting = await prisma.designProject.findFirst({
        where: { id: projectId, createdBy: session.userId },
      });

      existing = fallbackExisting as LinkedProject | null;
      canEdit = !!fallbackExisting;
    }

    if (!canEdit || !existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.json !== undefined) updateData.json = body.json;
    if (body.width !== undefined) updateData.width = body.width;
    if (body.height !== undefined) updateData.height = body.height;
    if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;

    const project = await prisma.designProject.update({
      where: { id: projectId },
      data: updateData,
    });

    return NextResponse.json({ data: project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireServerSession();
    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const existing = await prisma.designProject.findFirst({
      where: { id: projectId, createdBy: session.userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.designProject.delete({ where: { id: projectId } });

    return NextResponse.json({ data: { id: projectId } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete project" },
      { status: 500 },
    );
  }
}
