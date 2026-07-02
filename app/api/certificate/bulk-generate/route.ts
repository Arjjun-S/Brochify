import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireServerSession } from "@/lib/server/auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await requireServerSession();
    const body = await request.json();
    const { certificateId, records } = body;

    if (!certificateId || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const cert = await prisma.certificate.findUnique({ where: { id: certificateId }});
    if (!cert) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });

    const results = [];
    const verificationBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");

    for (const record of records) {
      const token = crypto.randomBytes(16).toString("hex");
      
      await prisma.certificateVerification.create({
        data: {
          certificateId: cert.id,
          recipientName: record.name,
          verificationToken: token,
          organization: record.organization || "Brochify",
        }
      });

      results.push({
        record,
        verificationToken: token,
        verificationUrl: `${verificationBaseUrl}/verify/${token}`,
      });
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to bulk generate" }, { status: 500 });
  }
}
