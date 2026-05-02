import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/server/auth";
import { createBrochureDraft, listBrochuresForUser } from "@/lib/server/data";
import type { BrochureStatus, BrochureTemplateId, EditorState } from "@/lib/server/types";

const BROCHURE_TEMPLATE_IDS: BrochureTemplateId[] = [
  "whiteBlue",
  "beigeDust",
  "softBlue",
  "tealGloss",
  "yellowDust",
  "posterFlyer",
];

function parseBrochureTemplate(value: unknown): EditorState["template"] | undefined {
  if (typeof value !== "string") return undefined;
  return BROCHURE_TEMPLATE_IDS.includes(value as BrochureTemplateId)
    ? (value as BrochureTemplateId)
    : undefined;
}

function isValidStatus(status: string | null): status is BrochureStatus {
  return status === "draft" || status === "pending" || status === "approved" || status === "rejected";
}

export async function GET(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusParam = request.nextUrl.searchParams.get("status");
  const brochures = await listBrochuresForUser(session, {
    status: isValidStatus(statusParam) ? statusParam : undefined,
  });

  return NextResponse.json({ brochures });
}

export async function POST(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "faculty") {
    return NextResponse.json({ error: "Only faculty can create brochures." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      assignedAdminId?: number;
      template?: string;
    };

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const assignedAdminId = Number(body.assignedAdminId);

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }

    if (!Number.isFinite(assignedAdminId) || assignedAdminId <= 0) {
      return NextResponse.json({ error: "Please select a valid admin." }, { status: 400 });
    }

    const brochureId = await createBrochureDraft({
      title,
      description,
      createdBy: session.userId,
      assignedAdminId,
      template: parseBrochureTemplate(body.template),
    });

    return NextResponse.json({ id: brochureId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create brochure." }, { status: 500 });
  }
}
