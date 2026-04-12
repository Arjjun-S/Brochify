import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/server/auth";
import { decideBrochure } from "@/lib/server/data";

function parseBrochureId(rawId: string): number | null {
  const id = Number.parseInt(rawId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only admin can reject brochures." }, { status: 403 });
  }

  const params = await context.params;
  const brochureId = parseBrochureId(params.id);
  if (!brochureId) {
    return NextResponse.json({ error: "Invalid brochure id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { content?: unknown; rejectionReason?: string };
    const rejectionReason = typeof body.rejectionReason === "string" ? body.rejectionReason.trim() : "";

    if (!rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
    }

    const brochure = await decideBrochure(brochureId, session, "rejected", body.content, rejectionReason);

    if (!brochure) {
      return NextResponse.json({ error: "Brochure not found." }, { status: 404 });
    }

    return NextResponse.json({ brochure });
  } catch {
    return NextResponse.json({ error: "Failed to reject brochure." }, { status: 500 });
  }
}
