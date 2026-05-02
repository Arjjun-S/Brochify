import { NextRequest, NextResponse } from "next/server";
import { requireServerSession } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    await requireServerSession();
    const { prompt } = await request.json();

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      return NextResponse.json(
        { error: "AI image generation is not configured" },
        { status: 503 },
      );
    }

    const Replicate = (await import("replicate")).default;
    const replicate = new Replicate({ auth: replicateToken });

    const output = await replicate.run(
      "stability-ai/stable-diffusion-3",
      { input: { prompt, aspect_ratio: "1:1" } },
    );

    return NextResponse.json({ data: output });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 },
    );
  }
}
