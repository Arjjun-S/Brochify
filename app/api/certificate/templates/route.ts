import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

type TemplateItem = {
  id: string;
  name: string;
  src: string;
};

const DEFAULT_PREFIX = "brochify/certificate/";

const toDisplayName = (value: string) => {
  return value
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getCloudinaryCredentials = () => {
  if (process.env.CLOUDINARY_URL) {
    const match = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      return {
        api_key: match[1],
        api_secret: match[2],
        cloud_name: match[3],
        secure: true,
      };
    }
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  };
};

export async function GET() {
  try {
    const credentials = getCloudinaryCredentials();
    if (!credentials) {
      return NextResponse.json({ templates: [] });
    }

    cloudinary.config(credentials);

    const templates: TemplateItem[] = [];
    let nextCursor: string | undefined;

    do {
      const response = (await cloudinary.api.resources({
        resource_type: "image",
        type: "upload",
        prefix: DEFAULT_PREFIX,
        max_results: 500,
        next_cursor: nextCursor,
      })) as { resources?: any[]; next_cursor?: string };

      for (const resource of response.resources || []) {
        if (!resource.secure_url) continue;
        const publicIdTail = resource.public_id.split("/").pop() || resource.public_id;
        templates.push({
          id: resource.asset_id || resource.public_id,
          name: toDisplayName(publicIdTail),
          src: resource.secure_url,
        });
      }
      nextCursor = response.next_cursor;
    } while (nextCursor);

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json(
      {
        templates: [],
        error: error instanceof Error ? error.message : "Unable to load templates.",
      },
      { status: 500 }
    );
  }
}
