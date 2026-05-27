/**
 * components/verdict-banner.tsx
 * ================================================================
 * Banner verdict yang mencolok di halaman hasil klasifikasi.
 * ================================================================
 */
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VerdictBannerProps {
  verdict: Verdict;
  yellowPct: number;
  threshold: number;     // 0.0 - 1.0
  marginPp: number;
  className?: string;
}

export function VerdictBanner({
  verdict,
  yellowPct,
  threshold,
  marginPp,
  className,
}: VerdictBannerProps) {
  const isReady = verdict === "SIAP PANEN";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border-2 p-6 shadow-sm",
        isReady
          ? "border-green-700 bg-gradient-to-br from-green-50 to-emerald-100"
          : "border-red-600 bg-gradient-to-br from-red-50 to-rose-100",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full",
            isReady ? "bg-green-700 text-white" : "bg-red-600 text-white"
          )}
        >
          {isReady ? (
            <CheckCircle2 className="h-8 w-8" />
          ) : (
            <AlertTriangle className="h-8 w-8" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Verdict Klasifikasi
          </p>
          <h2
            className={cn(
              "mt-1 text-3xl font-bold leading-tight",
              isReady ? "text-green-900" : "text-red-900"
            )}
          >
            {verdict}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Metric label="% Piksel Kuning" value={`${yellowPct.toFixed(2)}%`} />
            <Metric label="Ambang" value={`${(threshold * 100).toFixed(0)}%`} />
            <Metric
              label="Margin"
              value={`${marginPp >= 0 ? "+" : ""}${marginPp.toFixed(2)} pp`}
              valueClass={
                Math.abs(marginPp) < 5 ? "text-amber-700" : ""
              }
            />
          </div>
          {Math.abs(marginPp) < 5 && (
            <p className="mt-3 text-xs italic text-amber-800">
              ⚠️ Margin kecil (&lt; 5 pp) — verdict sensitif terhadap perubahan threshold.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={cn("font-mono text-base font-semibold text-slate-900", valueClass)}>
        {value}
      </p>
    </div>
  );
}
