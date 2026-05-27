/**
 * components/stats-overlay.tsx
 * ================================================================
 * Versi COMPACT dari StatsPanel, dirancang sebagai floating overlay
 * di pojok kanan-atas peta. Background semi-transparan agar peta
 * di belakangnya tetap terlihat.
 *
 * Berbeda dari StatsPanel:
 *   - Lebih ringkas (hanya field penting)
 *   - Background semi-transparan
 *   - Tidak ada header CardTitle
 *   - Dirancang untuk position absolute, max-width terbatas
 * ================================================================
 */
import type { ClassificationResult } from "@/lib/types";
import { formatNumber, formatPct, formatDuration } from "@/lib/utils";

interface StatsOverlayProps {
  result: ClassificationResult;
  className?: string;
}

export function StatsOverlay({ result, className = "" }: StatsOverlayProps) {
  return (
    <div
      className={`pointer-events-auto rounded-lg bg-white/95 p-3 text-xs shadow-md ring-1 ring-slate-200 backdrop-blur-sm ${className}`}
      style={{ minWidth: "220px", maxWidth: "260px" }}
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Statistik Klasifikasi
      </div>
      <dl className="space-y-1">
        <Row
          label="% Kuning"
          value={formatPct(result.yellow_pct_of_rice)}
          highlight
        />
        <Row label="% Hijau" value={formatPct(result.green_pct_of_rice)} />
        <Row
          label="Ambang"
          value={formatPct(result.threshold_used * 100, 0)}
        />
        <Row
          label="Margin"
          value={`${result.confidence_margin_pp >= 0 ? "+" : ""}${result.confidence_margin_pp.toFixed(2)} pp`}
          warning={Math.abs(result.confidence_margin_pp) < 5}
        />
        <div className="border-t border-slate-200 pt-1.5">
          <Row
            label="Dimensi"
            value={`${formatNumber(result.orthophoto_width)}×${formatNumber(result.orthophoto_height)}`}
            mono
          />
          <Row label="CRS" value={result.crs} mono />
          <Row label="Piksel padi" value={formatNumber(result.n_pixels_rice)} />
          <Row
            label="Waktu proses"
            value={formatDuration(result.duration_seconds)}
          />
        </div>
      </dl>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
  warning,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
  warning?: boolean;
}) {
  const valueClass = highlight
    ? "font-mono font-semibold text-green-800"
    : warning
      ? "font-mono font-medium text-amber-700"
      : mono
        ? "font-mono text-slate-900"
        : "font-medium text-slate-900";

  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <dt className="text-slate-600">{label}</dt>
      <dd className={valueClass}>{value}</dd>
    </div>
  );
}
