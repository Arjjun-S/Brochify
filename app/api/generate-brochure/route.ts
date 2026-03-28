import { NextRequest } from "next/server";
import { handleGenerateBrochure } from "@/app/api/_shared/handlers/generateBrochure";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleGenerateBrochure(req);
}
