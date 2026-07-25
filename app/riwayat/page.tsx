/**
 * app/riwayat/page.tsx
 * ================================================================
 * Halaman histori deteksi kesiapan panen dari database.
 *
 * Layout dua panel:
 *   - Panel kiri (sidebar): daftar lahan terdaftar + tombol filter
 *   - Panel kanan (main):   tabel riwayat + baris summary
 *
 * Di mobile, kedua panel ditumpuk vertikal (flex-col).
 * Di desktop (lg+), berdampingan (flex-row).
 * ================================================================
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiClientError } from "@/lib/api";
import type { Lahan, RiwayatDeteksi } from "@/lib/types";
import { cn, formatTimestamp, formatPct } from "@/lib/utils";

// ============================================================================
// Helper: format timestamp — bisa handle format backend YYYYMMDD_HHMMSS
// maupun format ISO 8601 dari database.
// ============================================================================
function formatTS(ts: string): string {
  if (/^\d{8}_\d{6}$/.test(ts)) return formatTimestamp(ts);
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// Halaman utama
// ============================================================================
export default function RiwayatPage() {
  const [daftarLahan,    setDaftarLahan]    = useState<Lahan[]>([]);
  const [semuaRiwayat,  setSemuaRiwayat]   = useState<RiwayatDeteksi[]>([]);
  const [selectedLahanId, setSelectedLahanId] = useState<number | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  // Fetch kedua endpoint secara paralel
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lahan, riwayat] = await Promise.all([
        api.fetchDaftarLahan(),
        api.fetchSemuaRiwayat(),
      ]);
      setDaftarLahan(lahan);
      setSemuaRiwayat(riwayat);
    } catch (err) {
      const msg =
        err instanceof ApiClientError ? err.detail :
        err instanceof Error          ? err.message : "Gagal memuat data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Map id_lahan → Lahan untuk lookup cepat di kolom tabel
  const lahanMap = new Map(daftarLahan.map((l) => [l.id_lahan, l]));

  // Filter riwayat sesuai lahan yang dipilih; null = tampilkan semua
  const filteredRiwayat = selectedLahanId
    ? semuaRiwayat.filter((r) => r.id_lahan === selectedLahanId)
    : semuaRiwayat;

  // Hitung jumlah deteksi per lahan untuk badge di sidebar
  const countPerLahan = semuaRiwayat.reduce<Record<number, number>>((acc, r) => {
    acc[r.id_lahan] = (acc[r.id_lahan] ?? 0) + 1;
    return acc;
  }, {});

  // Statistik ringkas dari data yang sedang ditampilkan
  const summary = filteredRiwayat.reduce(
    (acc, r) => {
      acc.total++;
      if (r.verdict === "SIAP PANEN") acc.siap++; else acc.belum++;
      return acc;
    },
    { total: 0, siap: 0, belum: 0 }
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Deteksi</h1>
          <p className="mt-1 text-sm text-slate-600">
            Histori klasifikasi kesiapan panen padi dari database.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── Loading awal ── */}
      {loading && semuaRiwayat.length === 0 ? (
        <div className="flex min-h-[30vh] items-center justify-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Memuat data dari database…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ── Panel Kiri: Daftar Lahan ── */}
          <aside className="w-full shrink-0 lg:w-72">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  Daftar Lahan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {/* Tombol "Semua Lahan" */}
                <button
                  onClick={() => setSelectedLahanId(null)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                    selectedLahanId === null
                      ? "bg-green-50 font-semibold text-green-800"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span>Semua Lahan</span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                    {semuaRiwayat.length}
                  </span>
                </button>

                {/* Entri per lahan */}
                {daftarLahan.length === 0 && !loading ? (
                  <p className="px-3 py-2 text-xs text-slate-500">
                    Belum ada lahan terdaftar di database.
                  </p>
                ) : (
                  daftarLahan.map((lahan) => {
                    const jumlah   = countPerLahan[lahan.id_lahan] ?? 0;
                    const isActive = selectedLahanId === lahan.id_lahan;
                    return (
                      <button
                        key={lahan.id_lahan}
                        onClick={() => setSelectedLahanId(lahan.id_lahan)}
                        className={cn(
                          "flex w-full items-start justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                          isActive
                            ? "bg-green-50 text-green-800"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate font-medium", isActive && "font-semibold")}>
                            {lahan.nama_lahan}
                          </p>
                          <p className="text-xs text-slate-500">
                            {lahan.luas_estimasi_ha} ha
                          </p>
                        </div>
                        <span className="ml-2 mt-0.5 shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                          {jumlah}
                        </span>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </aside>

          {/* ── Panel Kanan: Tabel Riwayat ── */}
          <div className="min-w-0 flex-1 space-y-4">
            {/* Sub-judul panel */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                {selectedLahanId
                  ? `Riwayat: ${lahanMap.get(selectedLahanId)?.nama_lahan ?? `Lahan #${selectedLahanId}`}`
                  : "Semua Riwayat Deteksi"}
              </h2>
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>

            {/* Tabel — overflow-x-auto agar bisa scroll horizontal di layar sempit */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {["No", "Tanggal & Waktu", "Nama Lahan", "Verdict",
                      "Kematangan (%)", "Threshold (%)", "Margin (pp)"]
                      .map((col, i) => (
                        <th
                          key={col}
                          className={cn(
                            "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600",
                            i >= 4 ? "text-right" : "text-left"
                          )}
                        >
                          {col}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRiwayat.length === 0 ? (
                    /* ── State kosong ── */
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Database className="h-10 w-10 text-slate-300" />
                          <p className="font-medium text-slate-600">
                            Belum ada data deteksi
                          </p>
                          <p className="text-xs text-slate-500">
                            Jalankan klasifikasi terlebih dahulu untuk melihat
                            riwayat di sini.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRiwayat.map((r, idx) => {
                      const isReady    = r.verdict === "SIAP PANEN";
                      const namaLahan  = lahanMap.get(r.id_lahan)?.nama_lahan
                                         ?? `Lahan #${r.id_lahan}`;
                      // Threshold disimpan sebagai desimal 0.0–1.0
                      const threshPct  = r.threshold <= 1
                        ? r.threshold * 100
                        : r.threshold;

                      return (
                        <tr
                          key={r.id_deteksi}
                          className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                        >
                          {/* No */}
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">
                            {idx + 1}
                          </td>

                          {/* Tanggal & Waktu */}
                          <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                            {formatTS(r.timestamp)}
                          </td>

                          {/* Nama Lahan */}
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {namaLahan}
                          </td>

                          {/* Verdict badge berwarna */}
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                                isReady
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              )}
                            >
                              {isReady
                                ? <CheckCircle2 className="h-3 w-3 shrink-0" />
                                : <AlertTriangle className="h-3 w-3 shrink-0" />}
                              {r.verdict}
                            </span>
                          </td>

                          {/* Kematangan % */}
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-slate-800">
                            {formatPct(r.persentase_kematangan)}
                          </td>

                          {/* Threshold % */}
                          <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-slate-600">
                            {formatPct(threshPct, 0)}
                          </td>

                          {/* Margin — amber kalau margin kecil (< 5 pp) */}
                          <td
                            className={cn(
                              "whitespace-nowrap px-4 py-3 text-right font-mono",
                              Math.abs(r.confidence_margin_pp) < 5
                                ? "text-amber-700"
                                : "text-slate-600"
                            )}
                          >
                            {r.confidence_margin_pp >= 0 ? "+" : ""}
                            {r.confidence_margin_pp.toFixed(2)} pp
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Baris summary ── */}
            {filteredRiwayat.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <span>
                  <span className="text-slate-500">Total deteksi: </span>
                  <span className="font-semibold text-slate-800">{summary.total}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  <span className="text-slate-500">Siap panen: </span>
                  <span className="font-semibold text-green-700">{summary.siap}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  <span className="text-slate-500">Belum siap: </span>
                  <span className="font-semibold text-red-700">{summary.belum}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
