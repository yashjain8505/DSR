import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/assets/proxy?url=<supabase-storage-url>
 *
 * Proxies a PDF (or other file) from Supabase Storage through our own domain
 * so it can be embedded in an <iframe> without cross-origin restrictions.
 * Only allows URLs from our Supabase storage bucket.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Only allow proxying from our Supabase storage
  const allowedOrigins = [
    "iubstoakzckephkspsys.supabase.co",
  ];

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!allowedOrigins.some((origin) => parsedUrl.hostname.includes(origin))) {
    return NextResponse.json(
      { error: "URL not allowed — only Supabase storage URLs are permitted" },
      { status: 403 },
    );
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }
}
