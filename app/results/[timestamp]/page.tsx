/**
 * app/results/[timestamp]/page.tsx
 * ================================================================
 * Layout fullscreen (Google Maps style):
 *   - Top bar tipis: back button | verdict badge | timestamp | downloads
 *   - Peta mengisi sisa tinggi viewport
 *   - StatsOverlay floating kanan-atas peta
 *   - Thumbnail PNG kiri-bawah peta, klik → lightbox modal
 * ================================================================
 */
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft, Download, Loader2, ZoomIn, X,
  CheckCircle2, AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatsOverlay } from "@/components/stats-overlay";
import { api, ApiClientError } from "@/lib/api";
import type { ClassificationResult } from "@/lib/types";
import { cn } from "@/lib/utils";

// Dynamic import — Leaflet butuh window (browser only)
const MapView = dynamic(
  () => import("@/components/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    ),
  }
);

interface PageProps {
  params: Promise<{ timestamp: string }>;
}

export default function ResultDetailPage({ params }: PageProps) {
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pngOpen, setPngOpen] = useState(false);

  useEffect(() => {
    params.then((p) => setTimestamp(p.timestamp));
  }, [params]);

  useEffect(() => {
    if (!timestamp) return;
    (async () => {
      try {
        const list = await api.listResults();
        const item = list.results.find((r) => r.timestamp === timestamp);
        if (!item) {
          setError(`Hasil dengan timestamp ${timestamp} tidak ditemukan.`);
          return;
        }
        const url = api.fileUrl("results", item.filename);
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data: ClassificationResult = await r.json();
        setResult({ ...data, success: true });
      } catch (err) {
        const msg =
          err instanceof ApiClientError ? err.detail :
          err instanceof Error ? err.message : "Gagal load hasil";
        setError(msg);
      }
    })();
  }, [timestamp]);

  // Tutup modal dengan Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPngOpen(false); };
    if (pngOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pngOpen]);

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/results" className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Riwayat
        </Link>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-900">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p>Memuat hasil...</p>
      </div>
    );
  }

  const extractName = (p: string) => p.split(/[/\\]/).pop() || "";

  // URL untuk tombol download (GeoTIFF resolusi penuh)
  const orthoUrl = api.fileUrl("orthophoto",     extractName(result.files.orthophoto));
  const classUrl = api.fileUrl("classification", extractName(result.files.classification));

  // URL PNG untuk Leaflet ImageOverlay
  const orthoPngUrl  = api.fileUrl("orthophoto_web",     extractName(result.files.orthophoto_web_png));
  const classPngUrl  = api.fileUrl("classification_web", extractName(result.files.classification_overlay_png));

  // PNG visualisasi lengkap (untuk thumbnail kiri-bawah & lightbox)
  const vizUrl = api.fileUrl("visualization", extractName(result.files.visualization));

  // Bounds WGS84 — pakai bounds_wgs84 kalau ada (hasil baru), fallback ke bounds lama
  const mapBounds = (result.bounds_wgs84 ?? result.bounds) as [number, number, number, number];

  const isReady = result.verdict === "SIAP PANEN";
  return (
    <>
      {/* Fullscreen map — fixed, menempel ke tepi viewport, top-16 = NavBar h-16 */}
      <div className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-hidden">
        {/* Peta mengisi seluruh area */}
        <MapView
          bounds={mapBounds}
          orthophotoPngUrl={orthoPngUrl}
          classificationPngUrl={classPngUrl}
          containerClassName="h-full w-full overflow-hidden"
        />

        {/* ── Kiri atas: Kembali · Verdict · Timestamp · Downloads ── */}
        <div className="absolute left-3 top-3 z-[1001] flex flex-col gap-2">
          {/* Kembali */}
          <Link href="/results">
            <span className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </span>
          </Link>

          {/* Verdict */}
          <div className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold shadow-md backdrop-blur-sm",
            isReady ? "bg-green-700 text-white" : "bg-red-600 text-white"
          )}>
            {isReady
              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
              : <AlertTriangle className="h-4 w-4 shrink-0" />}
            <span>{result.verdict}</span>
            <span className="font-mono text-xs opacity-80">
              {result.yellow_pct_of_rice.toFixed(2)}%
            </span>
          </div>

          {/* Timestamp */}
          <div className="rounded-lg bg-white/90 px-3 py-1.5 font-mono text-[11px] text-slate-500 shadow-md backdrop-blur-sm">
            {result.timestamp}
          </div>

          {/* Download buttons — hanya tampil kalau file ada (path tidak kosong) */}
          <div className="flex flex-col gap-1">
            {[
              { file: result.files.orthophoto,     href: orthoUrl, label: "Orthophoto (.tif)" },
              { file: result.files.classification, href: classUrl, label: "Klasifikasi (.tif)" },
              { file: result.files.visualization,  href: vizUrl,   label: "Peta PNG"           },
            ]
              .filter(({ file }) => !!file) // skip kalau path kosong (hasil manual)
              .map(({ href, label }) => (
                <a
                  key={label}
                  href={href}
                  download
                  className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow backdrop-blur-sm transition-colors hover:bg-white"
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </a>
              ))}
          </div>
        </div>

        {/* ── Kanan atas: StatsOverlay ── */}
        <div className="absolute right-3 top-3 z-[1001]">
          <StatsOverlay result={result} />
        </div>

        {/* ── Kiri bawah: PNG thumbnail ── */}
        <button
          onClick={() => setPngOpen(true)}
          className="group absolute bottom-8 left-3 z-[1001] overflow-hidden rounded-lg border-2 border-white shadow-lg transition-transform hover:scale-105 focus:outline-none"
          title="Klik untuk perbesar"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={vizUrl}
            alt="Peta klasifikasi"
            className="block h-36 w-52 object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/35">
            <ZoomIn className="h-7 w-7 text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
          </div>
          <div className="bg-black/60 px-2 py-0.5 text-center text-[10px] leading-tight text-white">
            PNG 300 DPI · klik perbesar
          </div>
        </button>
      </div>

      {/* ── Lightbox modal ── */}
      {pngOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPngOpen(false)}
        >
          <div className="relative mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPngOpen(false)}
              className="absolute -right-3 -top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md hover:bg-slate-100"
              aria-label="Tutup"
            >
              <X className="h-4 w-4 text-slate-700" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vizUrl}
              alt="Peta klasifikasi kesiapan panen padi"
              className="max-h-[88dvh] w-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
