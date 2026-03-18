import { fal } from "@fal-ai/client";
import { logger } from "@/lib/system/logging/apiLogger";

type FalImageResponse = {
  data?: {
    images?: Array<{
      url?: string;
    }>;
  };
};

// No need to manually read from env here if using the official client in a standard way,
// but we'll ensure the key is configured.
if (typeof window !== "undefined") {
  // In browser, the client expects NEXT_PUBLIC_FAL_KEY or we can set it:
  // fal.config({ credentials: process.env.NEXT_PUBLIC_FAL_API_KEY });
}
export async function generateEventImage(prompt: string) {
  try {
    const result = (await fal.subscribe("fal-ai/nano-banana-pro", {
      input: {
        prompt: `Professional academic conference poster illustration, ${prompt}, technology theme, vector style, blue and white color palette, high resolution, minimalist`,
        aspect_ratio: "16:9",
        resolution: "1K",
        num_images: 1,
        output_format: "png",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    })) as FalImageResponse;
    const imageUrl = result.data?.images?.[0]?.url ?? null;
    logger.log("FAL_AI", "GENERATE_IMAGE", { prompt }, { url: imageUrl });
    return imageUrl;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.log("FAL_AI", "ERROR", { prompt }, { error: message }, "ERROR");
    console.error("Error calling FAL AI with client:", error);
    return null;
  }
}
