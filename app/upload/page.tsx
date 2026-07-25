/**
 * app/upload/page.tsx
 * ================================================================
 * Halaman upload dengan dua tab:
 *   1. "Foto Drone"   — upload JPG → stitching ODM + klasifikasi HSV otomatis
 *   2. "Hasil Manual" — upload PNG orthophoto + PNG klasifikasi yang sudah ada
 *
 * KONSEP REACT YANG DIPAKAI:
 *   - useState untuk state lokal tiap tab
 *   - controlled input: nilai input selalu dari state, perubahan lewat onChange
 *   - useRouter untuk redirect programmatic setelah submit
 * ================================================================
 */
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/components/upload-dropzone";
import { api, ApiClientError } from "@/lib/api";

// ============================================================================
// Helper — input file GeoTIFF (.tif / .tiff)
// ============================================================================
function TifFileInput({
  onChange,
  disabled,
}: {
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);

  return (
    <div>
      <div
        onClick={() => ref.current?.click()}
        className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
      >
        <ImageIcon className="h-5 w-5 shrink-0 text-slate-400" />
        <span className="truncate text-sm text-slate-600">
          {name ?? "Klik untuk pilih file GeoTIFF (.tif)…"}
        </span>
      </div>
      <input
        ref={ref}
        type="file"
        accept=".tif,.tiff"
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setName(f?.name ?? null);
          onChange(f);
        }}
      />
    </div>
  );
}

// ============================================================================
// Helper — input file generik (PNG / JSON) dengan tampilan konsisten
// ============================================================================
function FileInputBox({
  label,
  hint,
  required,
  accept = "image/png",
  placeholder = "Klik untuk pilih file PNG…",
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  accept?: string;
  placeholder?: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div
        onClick={() => ref.current?.click()}
        className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 transition hover:bg-slate-100 disabled:pointer-events-none"
      >
        <ImageIcon className="h-5 w-5 shrink-0 text-slate-400" />
        <span className="truncate text-sm text-slate-600">
          {name ?? placeholder}
        </span>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setName(f?.name ?? null);
          onChange(f);
        }}
      />
    </div>
  );
}

// ============================================================================
// Tab 1 — Upload Foto Drone (stitching + klasifikasi HSV)
// ============================================================================
function DroneUploadTab() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const MIN_FILES = 4;

  async function handleSubmit() {
    if (files.length < MIN_FILES) {
      setError(`Butuh minimal ${MIN_FILES} foto JPG.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      // Threshold dihardcode 0.60 — bisa di-tuning ulang di halaman hasil
      const job = await api.submitStitchJob(files, 0.60);
      router.push(`/jobs/${job.job_id}`);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.detail :
        err instanceof Error ? err.message : "Error tidak diketahui",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Pilih Foto Drone</CardTitle>
          <CardDescription>
            Format JPG/JPEG dengan metadata EXIF GPS. Recommended: 20–100 foto,
            overlap 70–80%.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadDropzone
            files={files}
            onFilesSelected={setFiles}
            disabled={submitting}
            minFiles={MIN_FILES}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Mulai Proses</CardTitle>
          <CardDescription>
            Stitching ODM biasanya 10–60 menit tergantung jumlah foto dan spek laptop.
            Threshold siap panen: 60% (default).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <strong>Error:</strong> {error}
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={files.length < MIN_FILES || submitting}
            size="lg"
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim ke server…</>
            ) : (
              "Mulai Stitching & Klasifikasi"
            )}
          </Button>
          {files.length > 0 && files.length < MIN_FILES && (
            <p className="text-xs text-amber-700">
              Tambahkan {MIN_FILES - files.length} foto lagi untuk memulai.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Tab 2 — Upload Hasil Manual (GeoTIFF orthophoto + opsional PNG klasifikasi)
// ============================================================================
function ManualUploadTab() {
  const router = useRouter();
  // GeoTIFF orthophoto — bounds diekstrak otomatis oleh backend
  const [orthoTif,  setOrthoTif]  = useState<File | null>(null);
  // PNG overlay klasifikasi — opsional, user sudah punya PNG-nya
  const [classPng,  setClassPng]  = useState<File | null>(null);
  // JSON statistik dari rice_orthophoto_pipeline Sel 13 — opsional
  const [classJson, setClassJson] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!orthoTif) {
      setError("GeoTIFF orthophoto wajib dipilih.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.uploadManualResult(orthoTif, classPng, classJson);
      router.push(`/results/${result.timestamp}`);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.detail :
        err instanceof Error ? err.message : "Upload gagal",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            1. Upload File
          </CardTitle>
          <CardDescription>
            Backend akan membaca koordinat geografis langsung dari GeoTIFF —
            tidak perlu input manual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GeoTIFF input — pakai accept .tif/.tiff */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Orthophoto GeoTIFF <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500">
              File .tif hasil stitching ODM. Bounds WGS84 diekstrak otomatis.
            </p>
            <TifFileInput onChange={setOrthoTif} disabled={submitting} />
          </div>

          <FileInputBox
            label="Klasifikasi PNG (opsional)"
            hint="PNG overlay kuning/hijau dari rice_orthophoto_pipeline. Kosongkan jika hanya tampilkan orthophoto."
            onChange={setClassPng}
            disabled={submitting}
          />

          <FileInputBox
            label="Statistik JSON (opsional)"
            hint="File <nama>_result_<timestamp>.json dari rice_orthophoto_pipeline Sel 13. Menyinkronkan verdict & persentase kematangan."
            accept="application/json,.json"
            placeholder="Klik untuk pilih file JSON…"
            onChange={setClassJson}
            disabled={submitting}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Simpan & Tampilkan</CardTitle>
          <CardDescription>
            Backend mengonversi GeoTIFF ke PNG web, lalu redirect ke halaman peta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <strong>Error:</strong> {error}
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!orthoTif || submitting}
            size="lg"
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Memproses…</>
            ) : (
              <><Upload className="h-4 w-4" /> Simpan & Tampilkan di Peta</>
            )}
          </Button>
          {!orthoTif && (
            <p className="text-xs text-slate-500">Pilih GeoTIFF orthophoto dulu.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Halaman utama — tab selector
// ============================================================================
type Tab = "drone" | "manual";

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<Tab>("drone");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pilih mode upload sesuai data yang Anda miliki.
        </p>
      </div>

      {/* ── Tab selector ── */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
        {(
          [
            { id: "drone",  label: "Foto Drone (Stitching + Klasifikasi)" },
            { id: "manual", label: "Hasil Manual (Upload PNG)" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Konten tab ── */}
      {activeTab === "drone"  && <DroneUploadTab />}
      {activeTab === "manual" && <ManualUploadTab />}
    </div>
  );
}
