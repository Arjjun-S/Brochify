import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".svg", ".webp"]);

export async function GET() {
  try {
    const logosDir = path.join(process.cwd(), "public", "logos");
    const files = await readdir(logosDir, { withFileTypes: true });

    const logos = files
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        id: path.parse(name).name,
        name: path.parse(name).name.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        src: `/logos/${name}`,
      }));

    return NextResponse.json({ logos });
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
