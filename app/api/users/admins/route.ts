import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/server/auth";
import { listAdmins } from "@/lib/server/data";

export async function GET(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admins = await listAdmins();
  return NextResponse.json({ admins });
}
