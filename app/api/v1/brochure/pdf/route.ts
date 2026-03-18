import { NextRequest } from "next/server";
import { handleGeneratePdf } from "@/app/api/_shared/handlers/generatePdf";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return handleGeneratePdf(req);
}
