import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/server/prisma";

type LogoItem = {
  id: string;
  name: string;
  src: string;
};

type CloudinaryResource = {
  asset_id?: string;
  public_id: string;
  secure_url?: string;
};

const LOGO_TYPE_FALLBACKS = ["logo", "logos"] as const;
const DEFAULT_LOGO_PREFIX = "brochify/logos/";

const toDisplayName = (value: string) => {
  return value
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizePrefix = (prefix: string) => (prefix.endsWith("/") ? prefix : `${prefix}/`);

const getCloudinaryCredentials = () => {
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

const getLogosFromDatabase = async (): Promise<LogoItem[]> => {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        OR: LOGO_TYPE_FALLBACKS.map((type) => ({ type })),
      },
      orderBy: { createdAt: "asc" },
    });

    return assets
      .filter((asset) => Boolean(asset.cloudinaryUrl))
      .map((asset) => ({
        id: String(asset.id),
        name: toDisplayName(asset.name),
        src: asset.cloudinaryUrl,
      }));
  } catch {
    return [];
  }
};

const getLogosFromCloudinary = async (): Promise<LogoItem[]> => {
  const credentials = getCloudinaryCredentials();
  if (!credentials) {
    return [];
  }

  cloudinary.config(credentials);

  const prefix = normalizePrefix(process.env.CLOUDINARY_LOGO_PREFIX || DEFAULT_LOGO_PREFIX);
  const logos: LogoItem[] = [];
  let nextCursor: string | undefined;

  do {
    const response = (await cloudinary.api.resources({
      resource_type: "image",
      type: "upload",
      prefix,
      max_results: 500,
      next_cursor: nextCursor,
    })) as { resources?: CloudinaryResource[]; next_cursor?: string };

    for (const resource of response.resources || []) {
      if (!resource.secure_url) {
        continue;
      }

      const publicIdTail = resource.public_id.split("/").pop() || resource.public_id;

      logos.push({
        id: resource.asset_id || resource.public_id,
        name: toDisplayName(publicIdTail),
        src: resource.secure_url,
      });
    }

    nextCursor = response.next_cursor;
  } while (nextCursor);

  return logos;
};

export async function GET() {
  try {
    const dbLogos = await getLogosFromDatabase();
    if (dbLogos.length > 0) {
      return NextResponse.json({ logos: dbLogos });
    }

    const cloudinaryLogos = await getLogosFromCloudinary();

    return NextResponse.json({ logos: cloudinaryLogos });
  } catch (error) {
    return NextResponse.json(
      {
        logos: [],
        error: error instanceof Error ? error.message : "Unable to load logo library.",
      },
      { status: 500 },
    );
  }
}
