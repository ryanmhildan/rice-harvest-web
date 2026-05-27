/**
 * components/progress-bar.tsx
 * ================================================================
 * Progress bar reusable untuk stitching.
 * ================================================================
 */
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  /** Progress 0-100 */
  value: number;
  /** Label di atas bar */
  label?: string;
  /** Status text di bawah bar */
  status?: string;
  className?: string;
}

export function ProgressBar({ value, label, status, className }: ProgressBarProps) {
  // Clamp ke 0-100
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="font-medium text-slate-700">{label}</span>
          <span className="font-mono text-slate-600">{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-green-600 transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {status && <p className="text-xs text-slate-500">{status}</p>}
    </div>
  );
}
