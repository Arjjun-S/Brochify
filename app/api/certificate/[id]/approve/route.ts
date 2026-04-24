import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/server/auth";
import { decideCertificate } from "@/lib/server/data";

function parseCertificateId(rawId: string): number | null {
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
    return NextResponse.json({ error: "Only admin can approve certificates." }, { status: 403 });
  }

  const params = await context.params;
  const certificateId = parseCertificateId(params.id);
  if (!certificateId) {
    return NextResponse.json({ error: "Invalid certificate id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { content?: unknown };
    const certificate = await decideCertificate(certificateId, session, "approved", body.content, null);

    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    }

    return NextResponse.json({ certificate });
  } catch {
    return NextResponse.json({ error: "Failed to approve certificate." }, { status: 500 });
  }
}
