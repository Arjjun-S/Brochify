import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/server/auth";
import {
  deleteCertificateForFaculty,
  getCertificateByIdForUser,
  updateCertificateContent,
} from "@/lib/server/data";

function parseCertificateId(rawId: string): number | null {
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
  const certificateId = parseCertificateId(params.id);
  if (!certificateId) {
    return NextResponse.json({ error: "Invalid certificate id." }, { status: 400 });
  }

  const certificate = await getCertificateByIdForUser(certificateId, session);
  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  return NextResponse.json({ certificate });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await context.params;
  const certificateId = parseCertificateId(params.id);
  if (!certificateId) {
    return NextResponse.json({ error: "Invalid certificate id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as { content?: unknown };
    if (body.content === undefined) {
      return NextResponse.json({ error: "content is required." }, { status: 400 });
    }

    const certificate = await updateCertificateContent(certificateId, session, body.content);
    if (!certificate) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    }

    return NextResponse.json({ certificate });
  } catch {
    return NextResponse.json({ error: "Failed to save certificate." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "faculty") {
    return NextResponse.json({ error: "Only faculty can delete certificates." }, { status: 403 });
  }

  const params = await context.params;
  const certificateId = parseCertificateId(params.id);
  if (!certificateId) {
    return NextResponse.json({ error: "Invalid certificate id." }, { status: 400 });
  }

  try {
    const deleted = await deleteCertificateForFaculty(certificateId, session);
    if (!deleted) {
      return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete certificate." }, { status: 500 });
  }
}
