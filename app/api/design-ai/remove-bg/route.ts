import { NextRequest, NextResponse } from "next/server";
import { requireServerSession } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    await requireServerSession();
    const { image } = await request.json();

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      return NextResponse.json(
        { error: "Background removal is not configured" },
        { status: 503 },
      );
    }

    const Replicate = (await import("replicate")).default;
    const replicate = new Replicate({ auth: replicateToken });

    const output = await replicate.run(
      "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900f7aafdz293c52801f1bc2741f38670959eb78e6c",
      { input: { image } },
    );

    return NextResponse.json({ data: output });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove background" },
      { status: 500 },
    );
  }
}
