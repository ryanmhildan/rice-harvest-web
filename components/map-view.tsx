/**
 * components/map-view.tsx
 * ================================================================
 * Wrapper untuk Leaflet map dengan:
 *   1. Basemap OpenStreetMap
 *   2. Layer visualisasi PNG overlay (dari backend, langsung)
 *   3. Auto-zoom ke bounds saat mount
 *   4. Toggle visibility + opacity slider
 *
 * KENAPA PNG bukan GeoTIFF?
 *   - georaster/geotiff.js melempar error internal ("Offset is outside
 *     the bounds of the DataView") di microtask yang tidak bisa
 *     di-catch dengan try/await biasa → loading spinner tidak pernah
 *     selesai.
 *   - Penyebab root: NodeODM output GeoTIFF menggunakan proyeksi UTM
 *     + tiled/COG structure dengan absolute byte-offsets yang besar,
 *     tidak kompatibel dengan georaster-layer-for-leaflet.
 *   - PNG visualization (300 DPI, dari backend) sudah cukup untuk
 *     menampilkan hasil klasifikasi di peta. L.imageOverlay hanya
 *     butuh URL + bounds, tidak ada parsing binary.
 *   - GeoTIFF masih tersedia untuk download (tombol di results page).
 * ================================================================
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // side-effect: inject Leaflet CSS
import proj4 from "proj4";

interface MapViewProps {
  /** Bounds: [minLon, minLat, maxLon, maxLat] dari backend. */
  bounds: [number, number, number, number];
  /** Diterima tapi tidak dipakai di peta — hanya agar caller tidak perlu berubah. */
  orthophotoUrl: string;
  /** Sama — diterima tapi tidak di-fetch di peta. Gunakan tombol download untuk GeoTIFF. */
  classificationUrl: string;
  /** URL PNG visualisasi dari backend — dipakai sebagai overlay di peta. */
  fallbackImageUrl?: string;
  /** Tinggi map (Tailwind class). Default "h-[600px]". */
  height?: string;
  /**
   * Override class untuk outer div container. Jika disediakan, `height` diabaikan
   * dan default border/rounded tidak diterapkan. Berguna untuk mode fullscreen.
   */
  containerClassName?: string;
}

export function MapView({
  bounds,
  fallbackImageUrl,
  height = "h-[600px]",
  containerClassName,
  classificationUrl,
  orthophotoUrl,
}: MapViewProps) {
  // Backend: [minLon, minLat, maxLon, maxLat]
  // Leaflet: [[minLat, minLon], [maxLat, maxLon]]
  // useMemo agar referensi stabil, tidak trigger re-render anak berulang

  // const leafletBounds = useMemo<L.LatLngBoundsLiteral>(
  //   () => [
  //     [bounds[1], bounds[0]],
  //     [bounds[3], bounds[2]],
  //   ],
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [bounds[0], bounds[1], bounds[2], bounds[3]]
  // );

const leafletBounds = useMemo<L.LatLngBoundsLiteral>(() => {
  const [minX, minY, maxX, maxY] = bounds;

  const min = proj4("EPSG:32748", "EPSG:4326", [minX, minY]);
  const max = proj4("EPSG:32748", "EPSG:4326", [maxX, maxY]);

  console.log("converted min", min);
  console.log("converted max", max);

  return [
    [min[1], min[0]],
    [max[1], max[0]],
  ];
}, [bounds]);
 
   console.log("data in component bounds  ",bounds)
   console.log("data in component fallbackImageUrl  ", fallbackImageUrl)
   console.log("data in component classificationUrl  ", classificationUrl)
   console.log("data in component orthophotoUrl  ", orthophotoUrl)


  return (
    <div className={containerClassName ?? `${height} w-full overflow-hidden rounded-lg border border-slate-200`}>
      {/* bounds prop → MapContainer set initial view langsung ke area sawah,
          tanpa perlu useEffect tambahan. boundsOptions padding agar tidak kepotong. */}
      <MapContainer
        bounds={leafletBounds}
        boundsOptions={{ padding: [30, 30] }}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {fallbackImageUrl && (
          <PngOverlayLayer imageUrl={fallbackImageUrl} bounds={leafletBounds} />
        )}
      </MapContainer>
    </div> 
  );
}


/**
 * Tampilkan PNG visualization sebagai overlay di atas OSM basemap.
 * L.imageOverlay hanya butuh URL + bounds — tidak ada parsing binary,
 * tidak ada CORS issue (browser load via <img>, bukan fetch()).
 */
function PngOverlayLayer({
  imageUrl,
  bounds,
}: {
  imageUrl: string;
  bounds: L.LatLngBoundsLiteral;
}) {
  const map = useMap();
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(0.75);

  // Tambah overlay saat mount, hapus saat unmount
  useEffect(() => {
    const overlay = L.imageOverlay(imageUrl, bounds, { opacity: 0.75 });
    overlayRef.current = overlay;
    overlay.addTo(map);

    return () => {
      map.removeLayer(overlay);
      overlayRef.current = null;
    };
  }, [map, imageUrl, bounds]);

  // Sync toggle
  useEffect(() => {
    const ol = overlayRef.current;
    if (!ol) return;
    if (visible) {
      if (!map.hasLayer(ol)) ol.addTo(map);
    } else {
      if (map.hasLayer(ol)) map.removeLayer(ol);
    }
  }, [map, visible]);

  // Sync opacity
  useEffect(() => {
    overlayRef.current?.setOpacity(opacity);
  }, [opacity]);

  return (
    <div className="absolute bottom-3 right-3 z-[1000] rounded-md bg-white/95 p-3 text-xs shadow-md ring-1 ring-slate-200">
      <div className="space-y-2">
        <label className="flex items-center gap-2 font-medium text-slate-700">
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            className="h-3.5 w-3.5 accent-green-700"
          />
          Klasifikasi
        </label>
        <div className="border-t border-slate-200 pt-2">
          <label className="block text-[10px] font-medium uppercase tracking-wide text-slate-500">
            Opacity
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(opacity * 100)}
              onChange={(e) => setOpacity(Number(e.target.value) / 100)}
              disabled={!visible}
              className="w-24 accent-green-700"
            />
            <span className="w-8 text-right font-mono text-slate-700">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
