import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/server/prisma";

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

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME || "dxu5gvhv";
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where = type ? { type } : {};

    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: assets });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string || "custom-signature";
    const type = formData.get("type") as string || "signature";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const credentials = getCloudinaryCredentials();
    if (!credentials) {
      return NextResponse.json({ error: "Cloudinary credentials not configured" }, { status: 500 });
    }

    cloudinary.config(credentials);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "brochify/signatures",
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    const asset = await prisma.asset.create({
      data: {
        name,
        type,
        cloudinaryUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
      },
    });

    return NextResponse.json({ data: asset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload asset" },
      { status: 500 }
    );
  }
}