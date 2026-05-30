"use client";

/**
 * components/map-view.tsx
 * ================================================================
 * Peta Leaflet interaktif dengan dua layer PNG overlay terpisah:
 *   1. Orthophoto  — foto udara sawah (RGBA, NoData transparan)
 *   2. Klasifikasi — bercak kuning/hijau semi-transparan di atasnya
 *
 * KENAPA ZOOM CONTROL DIPINDAH?
 *   Default Leaflet zoom buttons (+/-) ada di kiri-atas. Tapi di
 *   halaman results, kiri-atas sudah diisi floating buttons (Kembali,
 *   Verdict, Download) dengan z-[1001] yang menutupi tombol zoom.
 *   Solusi: zoomControl={false} + tombol +/- custom di panel ini,
 *   dikendalikan lewat `mapRef`.
 *
 * Layer controls (toggle + opacity slider) dan tombol zoom dirender
 * DI LUAR MapContainer agar tidak mengganggu event Leaflet (scroll,
 * drag, double-click).
 * ================================================================
 */

import { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, ImageOverlay } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ============================================================================
// Props
// ============================================================================
interface MapViewProps {
  /** Bounds WGS84: [minLon, minLat, maxLon, maxLat] */
  bounds: [number, number, number, number];
  /** URL PNG RGBA orthophoto — dari /api/files/orthophoto_web/... */
  orthophotoPngUrl?: string;
  /** URL PNG RGBA overlay klasifikasi — dari /api/files/classification_web/... */
  classificationPngUrl?: string;
  /** Tinggi map dalam Tailwind class. Default "h-[600px]". */
  height?: string;
  /**
   * Override class untuk div terluar. Kalau ada, `height` diabaikan.
   * Contoh fullscreen: containerClassName="h-full w-full overflow-hidden"
   */
  containerClassName?: string;
}

// ============================================================================
// Komponen utama
// ============================================================================
export function MapView({
  bounds,
  orthophotoPngUrl,
  classificationPngUrl,
  height = "h-[600px]",
  containerClassName,
}: MapViewProps) {
  /**
   * mapRef: referensi ke instance Leaflet map.
   * Dipakai tombol +/- yang ada di luar MapContainer untuk zoom
   * tanpa harus masuk ke dalam context Leaflet.
   */
  const mapRef = useRef<L.Map | null>(null);

  // State layer controls — ditaruh di sini agar bisa di-pass ke ImageOverlay
  const [showOrtho, setShowOrtho]       = useState(true);
  const [showClass, setShowClass]       = useState(true);
  const [classOpacity, setClassOpacity] = useState(0.65);

  /**
   * useMemo: stabilkan referensi bounds agar ImageOverlay tidak
   * re-render terus setiap parent render.
   *
   * Leaflet: [[minLat, minLon], [maxLat, maxLon]]
   * Backend: [minLon, minLat, maxLon, maxLat]
   */
  const leafletBounds = useMemo<L.LatLngBoundsLiteral>(
    () => [
      [bounds[1], bounds[0]], // south-west
      [bounds[3], bounds[2]], // north-east
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bounds[0], bounds[1], bounds[2], bounds[3]],
  );

  const hasLayers = !!(orthophotoPngUrl || classificationPngUrl);

  return (
    <div
      className={
        containerClassName ??
        `${height} w-full overflow-hidden rounded-lg border border-slate-200`
      }
      style={{ position: "relative" }}
    >
      {/*
       * MapContainer: wrapper Leaflet.
       * - zoomControl={false}: tombol +/- default dihapus karena akan
       *   tertutup floating UI. Kita ganti dengan tombol custom di panel.
       * - bounds + boundsOptions: auto-zoom ke sawah saat pertama load.
       * - scrollWheelZoom={true}: zoom dengan scroll mouse tetap aktif.
       * - ref={mapRef}: referensi map untuk tombol zoom di luar.
       */}
      <MapContainer
        ref={mapRef}
        bounds={leafletBounds}
        boundsOptions={{ padding: [30, 30] }}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        maxZoom={22}
        style={{ height: "100%", width: "100%" }}
      >
        {/*
         * maxNativeZoom={19}: OSM hanya punya tile sampai zoom 19.
         * maxZoom={22}: Leaflet boleh zoom sampai 22, tile zoom 19
         * akan di-upscale (diperbesar) untuk level 20-22.
         */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxNativeZoom={19}
          maxZoom={22}
        />

        {/* Layer 1 — Orthophoto PNG */}
        {orthophotoPngUrl && (
          <ImageOverlay
            url={orthophotoPngUrl}
            bounds={leafletBounds}
            opacity={showOrtho ? 1.0 : 0}
            zIndex={10}
          />
        )}

        {/* Layer 2 — Overlay klasifikasi PNG */}
        {classificationPngUrl && (
          <ImageOverlay
            url={classificationPngUrl}
            bounds={leafletBounds}
            opacity={showClass ? classOpacity : 0}
            zIndex={20}
          />
        )}
      </MapContainer>

      {/*
       * Panel kontrol — DI LUAR MapContainer agar tidak ganggu event peta.
       * absolute kanan-bawah, z-[1000].
       * Berisi: tombol zoom (+/-), toggle layer, slider opacity.
       */}
      <div className="absolute bottom-3 right-3 z-[1000] min-w-[160px] rounded-md bg-white/95 p-3 text-xs shadow-md ring-1 ring-slate-200">

        {/* ── Tombol zoom ── */}
        <div className="mb-2 flex items-center justify-between">
          <span className="font-semibold uppercase tracking-wide text-slate-500">
            Zoom
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-base font-bold text-slate-700 hover:bg-slate-200 active:bg-slate-300"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-base font-bold text-slate-700 hover:bg-slate-200 active:bg-slate-300"
              title="Zoom out"
            >
              −
            </button>
          </div>
        </div>

        {/* ── Layer controls ── */}
        {hasLayers && (
          <>
            <div className="mb-1.5 border-t border-slate-200 pt-2 font-semibold uppercase tracking-wide text-slate-500">
              Layer
            </div>

            <div className="space-y-2">
              {/* Toggle orthophoto */}
              {orthophotoPngUrl && (
                <label className="flex cursor-pointer items-center gap-2 text-slate-700">
                  <input
                    type="checkbox"
                    checked={showOrtho}
                    onChange={(e) => setShowOrtho(e.target.checked)}
                    className="h-3.5 w-3.5 accent-blue-600"
                  />
                  Orthophoto
                </label>
              )}

              {/* Toggle + slider opacity klasifikasi */}
              {classificationPngUrl && (
                <div className="space-y-1">
                  <label className="flex cursor-pointer items-center gap-2 text-slate-700">
                    <input
                      type="checkbox"
                      checked={showClass}
                      onChange={(e) => setShowClass(e.target.checked)}
                      className="h-3.5 w-3.5 accent-green-700"
                    />
                    Klasifikasi
                  </label>

                  {showClass && (
                    <div className="pl-5">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={Math.round(classOpacity * 100)}
                          onChange={(e) =>
                            setClassOpacity(Number(e.target.value) / 100)
                          }
                          className="w-20 accent-green-700"
                        />
                        <span className="w-8 text-right font-mono text-slate-600">
                          {Math.round(classOpacity * 100)}%
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-3 w-3 rounded-sm bg-[#FFEB3B] ring-1 ring-slate-300" />
                          <span className="text-[10px] text-slate-500">Padi matang</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block h-3 w-3 rounded-sm bg-[#4CAF50] ring-1 ring-slate-300" />
                          <span className="text-[10px] text-slate-500">Belum matang</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
