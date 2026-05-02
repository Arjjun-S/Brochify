import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/server/auth";
import { createCertificateDraft, listCertificatesForUser } from "@/lib/server/data";
import type { CertificateStatus } from "@/lib/server/types";

function isValidStatus(status: string | null): status is CertificateStatus {
  return status === "draft" || status === "pending" || status === "approved" || status === "rejected";
}

export async function GET(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const statusParam = request.nextUrl.searchParams.get("status");
    const certificates = await listCertificatesForUser(session, {
      status: isValidStatus(statusParam) ? statusParam : undefined,
    });

    return NextResponse.json({ certificates });
  } catch (error: unknown) {
    console.error("Failed to list certificates", error);
    const message = error instanceof Error ? error.message : "Failed to load certificates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "faculty") {
    return NextResponse.json({ error: "Only faculty can create certificates." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      assignedAdminId?: number;
      content?: unknown;
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

    const certificateId = await createCertificateDraft({
      title,
      description,
      assignedAdminId,
      createdBy: session.userId,
      content: body.content,
    });

    return NextResponse.json({ id: certificateId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create certificate." }, { status: 500 });
  }
}
