/**
 * app/page.tsx
 * ================================================================
 * Halaman beranda "/" — dashboard overview sistem.
 *
 * KONSEP NEXT.JS:
 *   - File "page.tsx" otomatis jadi route. app/page.tsx → "/"
 *   - Server Component by default (lebih cepat, no JS dikirim ke client)
 *   - Untuk konten dinamis (SystemStatus), pakai komponen Client Component
 *     yang sudah ditandai "use client" di file masing-masing.
 * ================================================================
 */
import Link from "next/link";
import { Upload, History, Sprout, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SystemStatus } from "@/components/system-status";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 px-6 py-12 sm:px-12 sm:py-16">
        <div className="flex items-center gap-3 text-green-700">
          <Sprout className="h-6 w-6" />
          <span className="text-sm font-semibold uppercase tracking-wide">
            Sistem Deteksi Kesiapan Panen Padi
          </span>
        </div>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold text-slate-900 sm:text-4xl">
          Deteksi & pemetaan kesiapan panen padi dari citra drone secara{" "}
          <span className="text-green-700">offline</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-700">
          Upload foto drone berresolusi tinggi, sistem akan otomatis menggabungkan
          (stitching) menjadi orthophoto, mengklasifikasi tingkat kematangan berbasis
          segmentasi warna HSV, dan menghasilkan verdict siap panen.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/upload">
            <Button size="lg" className="gap-2">
              <Upload className="h-4 w-4" />
              Mulai Klasifikasi
            </Button>
          </Link>
          <Link href="/results">
            <Button variant="outline" size="lg" className="gap-2">
              <History className="h-4 w-4" />
              Lihat Riwayat
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cara Kerja Sistem</CardTitle>
              <CardDescription>
                Empat tahap pipeline berbasis edge computing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-slate-700">
                <Step num={1} title="Akuisisi Foto Drone" desc="UAV menerbangi sawah dan mengambil 10-100+ foto dengan overlap 70-80% dan metadata EXIF GPS." />
                <Step num={2} title="Stitching ODM" desc="Foto digabungkan menjadi satu orthophoto ber-georeferensi via OpenDroneMap lokal (Docker, fully offline)." />
                <Step num={3} title="Klasifikasi HSV" desc="Segmentasi 2 kelas (kuning = matang, hijau = belum matang) dengan operasi morfologi untuk reduksi noise." />
                <Step num={4} title="Verdict & Visualisasi" desc="Verdict whole-orthophoto (SIAP / BELUM SIAP) + peta tematik interaktif Leaflet untuk dokumentasi." />
              </ol>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-amber-900">
                <Sparkles className="h-4 w-4" />
                Disclaimer Akademis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-900">
                Sistem mendeteksi kesiapan panen berdasarkan <strong>indikator visual
                warna kanopi</strong>, bukan pengukuran fisiologis langsung (kadar
                air gabah, berat butir). Hasil dimaksudkan sebagai{" "}
                <strong>pendukung keputusan</strong> dan tidak menggantikan inspeksi
                lapangan oleh petani atau penyuluh pertanian.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <SystemStatus />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prasyarat Sistem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <p>Docker Desktop berjalan</p>
              <p>NodeODM container aktif (port 3000)</p>
              <p>FastAPI backend aktif (port 8000)</p>
              <p>Foto drone min. 4 buah, JPG dengan EXIF GPS</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white">
        {num}
      </span>
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-slate-600">{desc}</p>
      </div>
    </li>
  );
}
