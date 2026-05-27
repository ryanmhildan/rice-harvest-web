/**
 * app/upload/page.tsx
 * ================================================================
 * Halaman upload foto drone + submit stitching job.
 *
 * Flow:
 *   1. User pilih/drop foto via UploadDropzone
 *   2. Atur threshold (slider)
 *   3. Klik "Mulai Klasifikasi" → POST /jobs/stitch
 *   4. Redirect ke /jobs/<jobId> untuk lihat progress
 *
 * KENAPA "use client"?
 * Halaman ini interaktif (state, form, event handler), tidak bisa
 * Server Component. "use client" pindahkan rendering ke browser.
 * ================================================================
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/components/upload-dropzone";
import { api, ApiClientError } from "@/lib/api";

const MIN_FILES = 4;

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [threshold, setThreshold] = useState(60); // 0-100 di UI, /100 saat submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (files.length < MIN_FILES) {
      setError(`Butuh minimal ${MIN_FILES} foto.`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const job = await api.submitStitchJob(files, threshold / 100);
      // Redirect ke halaman status dengan job_id
      router.push(`/jobs/${job.job_id}`);
    } catch (err) {
      const msg = err instanceof ApiClientError
        ? err.detail
        : err instanceof Error
          ? err.message
          : "Error tidak diketahui";
      setError(msg);
      setSubmitting(false);
    }
  }

  const canSubmit = files.length >= MIN_FILES && !submitting;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload Foto Drone</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pilih foto hasil terbang drone untuk diproses jadi orthophoto dan diklasifikasi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Pilih Foto Drone</CardTitle>
          <CardDescription>
            Format JPG/JPEG dengan metadata EXIF GPS. Recommended: 20-100 foto dengan overlap 70-80%.
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
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            2. Konfigurasi Klasifikasi
          </CardTitle>
          <CardDescription>
            Threshold untuk verdict SIAP PANEN — bisa di-tuning nanti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="threshold" className="text-sm font-medium text-slate-700">
                Ambang Siap Panen
              </label>
              <span className="rounded bg-green-100 px-2 py-0.5 font-mono text-sm font-semibold text-green-800">
                {threshold}%
              </span>
            </div>
            <input
              id="threshold"
              type="range"
              min={30}
              max={90}
              step={5}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              disabled={submitting}
              className="w-full accent-green-700"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>30% (longgar)</span>
              <span>60% (default)</span>
              <span>90% (ketat)</span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Persentase minimum piksel kuning yang dianggap &ldquo;Siap Panen&rdquo;.
              Lahan dengan piksel kuning &ge; ambang ini akan diklasifikasi sebagai SIAP PANEN.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Mulai Klasifikasi</CardTitle>
          <CardDescription>
            Stitching ODM dapat memakan waktu 10-60 menit tergantung jumlah foto dan spek laptop.
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
            disabled={!canSubmit}
            size="lg"
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengirim ke server...
              </>
            ) : (
              <>Mulai Stitching &amp; Klasifikasi</>
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
