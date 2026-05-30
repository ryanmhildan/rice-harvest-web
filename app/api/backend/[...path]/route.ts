/**
 * app/api/backend/[...path]/route.ts
 * ================================================================
 * Proxy catch-all untuk semua endpoint FastAPI backend.
 *
 * KENAPA PERLU INI?
 *   browser fetch() dari port 3001 → port 8000 diblokir oleh:
 *   1. IDM (Internet Download Manager) — intercept semua fetch()
 *   2. CORS preflight — tergantung konfigurasi browser/extension
 *
 *   Solusi: browser fetch ke /api/backend/... (same-origin),
 *   Next.js server yang forward ke backend (server-to-server,
 *   tidak kena IDM maupun CORS browser).
 *
 * CONTOH:
 *   Browser → GET /api/backend/health
 *   Next.js → GET http://localhost:8000/health
 *
 *   Browser → POST /api/backend/jobs/stitch (FormData)
 *   Next.js → POST http://localhost:8000/jobs/stitch (diteruskan)
 *
 *   Browser → GET /api/backend/jobs/abc123?threshold=0.6
 *   Next.js → GET http://localhost:8000/jobs/abc123?threshold=0.6
 * ================================================================
 */

import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string,
): Promise<NextResponse> {
  const { path } = await params;
  const url = new URL(request.url);
  const backendUrl = `${API_BASE}/${path.join("/")}${url.search}`;

  try {
    const headers: Record<string, string> = {};
    const contentType = request.headers.get("content-type");
    if (contentType) headers["content-type"] = contentType;

    const fetchOptions: RequestInit & { duplex?: string } = {
      method,
      headers,
      cache: "no-store",
    };

    if (method !== "GET" && method !== "HEAD" && request.body) {
      fetchOptions.body = request.body;
      fetchOptions.duplex = "half"; // diperlukan untuk streaming body di Node.js
    }

    const upstream = await fetch(backendUrl, fetchOptions as RequestInit);

    const responseContentType =
      upstream.headers.get("content-type") || "application/json";

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": responseContentType },
    });
  } catch {
    return new NextResponse(
      JSON.stringify({ detail: "Proxy ke backend gagal. Pastikan FastAPI berjalan." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const GET = (
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) => proxyRequest(req, params, "GET");

export const POST = (
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) => proxyRequest(req, params, "POST");
