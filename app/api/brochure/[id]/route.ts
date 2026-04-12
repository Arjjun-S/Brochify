import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/server/auth";
import { getBrochureByIdForUser, updateBrochureContent } from "@/lib/server/data";

function parseBrochureId(rawId: string): number | null {
  const id = Number.parseInt(rawId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const brochureId = parseBrochureId(params.id);
  if (!brochureId) {
    return NextResponse.json({ error: "Invalid brochure id." }, { status: 400 });
  }

  const brochure = await getBrochureByIdForUser(brochureId, session);
  if (!brochure) {
    return NextResponse.json({ error: "Brochure not found." }, { status: 404 });
  }

  return NextResponse.json({ brochure });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const brochureId = parseBrochureId(params.id);
  if (!brochureId) {
    return NextResponse.json({ error: "Invalid brochure id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { content?: unknown };
    if (body.content === undefined) {
      return NextResponse.json({ error: "content is required." }, { status: 400 });
    }

    const brochure = await updateBrochureContent(brochureId, session, body.content);
    if (!brochure) {
      return NextResponse.json({ error: "Brochure not found." }, { status: 404 });
    }

    return NextResponse.json({ brochure });
  } catch {
    return NextResponse.json({ error: "Failed to save brochure." }, { status: 500 });
  }
}
