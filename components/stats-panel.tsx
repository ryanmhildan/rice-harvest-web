/**
 * components/stats-panel.tsx
 * ================================================================
 * Panel tabel statistik dari hasil klasifikasi.
 * ================================================================
 */
import type { ClassificationResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { formatNumber, formatPct, formatDuration } from "@/lib/utils";

interface StatsPanelProps {
  result: ClassificationResult;
}

export function StatsPanel({ result }: StatsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistik Klasifikasi</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Row label="Dimensi orthophoto"
               value={`${formatNumber(result.orthophoto_width)} × ${formatNumber(result.orthophoto_height)} px`} />
          <Row label="CRS" value={result.crs} mono />
          <Row label="Total piksel" value={formatNumber(result.n_pixels_total)} />
          <Row label="Piksel valid (non-NoData)" value={formatNumber(result.n_pixels_valid)} />
          <Row label="Piksel padi total" value={formatNumber(result.n_pixels_rice)} />
          <Row label="Piksel kuning (matang)" value={formatNumber(result.n_pixels_yellow)} />
          <Row label="Piksel hijau (belum matang)" value={formatNumber(result.n_pixels_green)} />
          <Row label="% Padi dari area valid" value={formatPct(result.rice_pct_of_valid, 1)} />
          <Row label="% Kuning dari padi" value={formatPct(result.yellow_pct_of_rice)} highlight />
          <Row label="% Hijau dari padi" value={formatPct(result.green_pct_of_rice)} />
          <Row label="Threshold dipakai" value={formatPct(result.threshold_used * 100, 0)} />
          <Row label="Waktu pemrosesan" value={formatDuration(result.duration_seconds)} />
        </dl>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 py-1.5">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd
        className={
          mono
            ? "font-mono text-sm text-slate-900"
            : highlight
              ? "text-base font-semibold text-green-800"
              : "text-sm font-medium text-slate-900"
        }
      >
        {value}
      </dd>
    </div>
  );
}
