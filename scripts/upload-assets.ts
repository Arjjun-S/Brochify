import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || "dxu5gvhv",
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const prisma = new PrismaClient();

const ASSET_FOLDERS: Record<string, string> = {
  logos: "public/logos",
  certificate: "public/certificate",
  badges: "public/badges",
};

const ASSET_TYPES = {
  logos: "logo",
  certificate: "certificate_template",
  badges: "badge",
};

async function uploadFile(filePath: string, folder: string, type: string) {
  const fileName = path.basename(filePath);

  const result = await cloudinary.uploader.upload(filePath, {
    folder: `brochify/${folder}`,
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    resource_type: "image",
  });

  const asset = await prisma.asset.create({
    data: {
      name: fileName,
      type: type,
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
    },
  });

  console.log(`Uploaded ${fileName}: ${result.secure_url}`);
  return asset;
}

async function main() {
  const folders = Object.entries(ASSET_FOLDERS);

  for (const [key, folderPath] of folders) {
    const absolutePath = path.join(process.cwd(), folderPath);

    if (!fs.existsSync(absolutePath)) {
      console.log(`Folder ${folderPath} does not exist, skipping...`);
      continue;
    }

    const files = fs.readdirSync(absolutePath);

    for (const file of files) {
      const filePath = path.join(absolutePath, file);
      const ext = path.extname(file).toLowerCase();

      const imageExts = [".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif"];
      if (!imageExts.includes(ext)) {
        console.log(`Skipping non-image file: ${file}`);
        continue;
      }

      try {
        await uploadFile(filePath, key, ASSET_TYPES[key]);
      } catch (error) {
        console.error(`Failed to upload ${file}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  console.log("\nAll assets uploaded successfully!");
  const assets = await prisma.asset.findMany();
  console.log("\nUploaded assets:");
  assets.forEach((a) => console.log(`  - ${a.name} (${a.type}): ${a.cloudinaryUrl}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());