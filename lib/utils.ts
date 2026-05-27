/**
 * lib/utils.ts
 * ================================================================
 * Helper functions dasar yang dipakai di banyak tempat.
 * ================================================================
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn: gabungkan class Tailwind dengan benar.
 *
 * KENAPA INI ADA?
 * Tailwind punya banyak class yang konflik (mis. "bg-red-500" vs "bg-blue-500").
 * Kalau kita tulis:
 *   <div className={`bg-red-500 ${isActive ? "bg-blue-500" : ""}`}>
 * Tailwind akan render dua-duanya, dan urutan menentukan yang menang.
 *
 * Dengan cn() + tailwind-merge, class yang konflik OTOMATIS disatukan
 * dengan yang terakhir menang:
 *   cn("bg-red-500", isActive && "bg-blue-500")  // hanya bg-blue-500
 *
 * Pattern ini dipakai di shadcn/ui dan jadi standar React+Tailwind.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka jadi persen dengan 1-2 desimal.
 * formatPct(58.834)        → "58.83%"
 * formatPct(58.834, 1)     → "58.8%"
 */
export function formatPct(value: number, digits: number = 2): string {
  return `${value.toFixed(digits)}%`;
}

/**
 * Format angka besar dengan separator ribuan.
 * formatNumber(1234567)    → "1,234,567"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

/**
 * Format timestamp dari backend "20260524_114530" → "24 Mei 2026, 11:45"
 */
export function formatTimestamp(ts: string): string {
  // Backend format: YYYYMMDD_HHMMSS
  if (!/^\d{8}_\d{6}$/.test(ts)) return ts;

  const year = ts.slice(0, 4);
  const month = ts.slice(4, 6);
  const day = ts.slice(6, 8);
  const hour = ts.slice(9, 11);
  const minute = ts.slice(11, 13);

  const date = new Date(
    Number(year), Number(month) - 1, Number(day),
    Number(hour), Number(minute)
  );

  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format durasi detik → "1m 23s" atau "45s"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}
