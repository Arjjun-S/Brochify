import { NextRequest, NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const session = readSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user: session });
}
