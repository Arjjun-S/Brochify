import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return NextResponse.json({ data: [] });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const page = searchParams.get("page") || "1";
    const perPage = searchParams.get("per_page") || "20";

    let url: string;
    if (query) {
      url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
    } else {
      url = `https://api.unsplash.com/photos/random?count=${perPage}&collections=317099`;
    }

    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    if (!response.ok) {
      return NextResponse.json({ data: [] });
    }

    const data = await response.json();
    const images = query
      ? (data.results || []).map((img: Record<string, unknown>) => ({
          id: img.id,
          urls: img.urls,
          alt_description: img.alt_description,
          user: img.user,
        }))
      : (Array.isArray(data) ? data : []).map((img: Record<string, unknown>) => ({
          id: img.id,
          urls: img.urls,
          alt_description: img.alt_description,
          user: img.user,
        }));

    return NextResponse.json({ data: images });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch images" },
      { status: 500 },
    );
  }
}
