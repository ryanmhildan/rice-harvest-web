/**
 * app/api/files/[...path]/route.ts
 * ================================================================
 * Proxy route: meneruskan request file ke FastAPI backend.
 *
 * KENAPA PERLU INI?
 *   Saat georaster di map-view.tsx memanggil fetch() untuk GeoTIFF,
 *   browser akan memblokir karena:
 *   1. CORS — fetch() dari origin 3001 ke backend 8000 butuh
 *      Access-Control-Allow-Origin header (static files di FastAPI
 *      sering tidak punya ini).
 *   2. IDM / extension — browser extension seperti Internet Download
 *      Manager bisa intercept fetch() binary.
 *
 *   Solusi: browser fetch ke /api/files/... (same origin, port 3001),
 *   lalu Next.js server yang fetch ke backend (server-to-server,
 *   tidak kena CORS maupun browser extension).
 *
 * CONTOH:
 *   Browser → GET /api/files/classification/foo.tif
 *   Next.js → GET http://localhost:8000/files/classification/foo.tif
 *   Response di-pipe balik ke browser.
 * ================================================================
 */

import { NextRequest, NextResponse } from "next/server";

// Pakai NEXT_PUBLIC_ sama seperti lib/api.ts supaya konsisten
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const backendUrl = `${API_BASE}/files/${path.join("/")}`;

  try {
    const upstream = await fetch(backendUrl, {
      // Jangan cache di Next.js layer — biar client bisa minta ulang
      cache: "no-store",
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";

    // Pipe stream langsung — tidak di-buffer ke memory
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Proxy ke backend gagal", { status: 502 });
  }
}
