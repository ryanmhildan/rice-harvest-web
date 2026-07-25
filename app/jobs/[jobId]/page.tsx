/**
 * app/jobs/[jobId]/page.tsx
 * ================================================================
 * Halaman status job stitching.
 * URL: /jobs/abc123def456
 *
 * KONSEP NEXT.JS:
 *   - Folder [jobId] artinya dynamic route. Next.js otomatis ekstrak
 *     value dari URL dan kirim ke komponen via prop `params`.
 *   - useEffect + setInterval untuk polling tiap 5 detik.
 *   - Auto-trigger klasifikasi saat stitching selesai.
 * ================================================================
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/progress-bar";
import { api, ApiClientError } from "@/lib/api";
import type { JobInfo, ClassificationResult } from "@/lib/types";

interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default function JobStatusPage({ params }: PageProps) {
  // Next.js 15: params adalah Promise, butuh use() atau await
  // Simpler approach untuk pemula: pakai useState + useEffect
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [classifyResult, setClassifyResult] = useState<ClassificationResult | null>(null);
  const [classifying, setClassifying] = useState(false);
  /**
   * useRef: flag "sudah mulai klasifikasi" — tidak trigger re-render,
   * sehingga tidak menyebabkan useEffect di bawah re-run dan
   * membatalkan request yang sedang berjalan.
   */
  const hasClassified = useRef(false);
  const router = useRouter();

  // Unwrap params (Next.js 15 API change)
  useEffect(() => {
    params.then((p) => setJobId(p.jobId));
  }, [params]);

  // Polling status job — hanya bergantung pada jobId
  useEffect(() => {
    if (!jobId) return;

    /**
     * `cancelled`: flag untuk batalkan update state saat komponen unmount
     * atau jobId berubah. Ini SATU-SATUNYA variabel yang boleh di-close
     * oleh effect ini.
     *
     * BUG LAMA: dependency array berisi `classifying` dan `classifyResult`.
     * Ketika setClassifying(true) dipanggil → React re-render → effect
     * cleanup (cancelled=true) → effect baru. Akibatnya classifyJob()
     * selesai tapi cancelled=true sehingga setClassifyResult() tidak
     * pernah dipanggil → loading spinner abadi.
     *
     * FIX: dependency array hanya [jobId]. Flag "sudah klasifikasi"
     * disimpan di hasClassified.current (useRef) agar tidak trigger
     * re-render dan tidak membatalkan effect yang sedang berjalan.
     */
    let cancelled = false;
    hasClassified.current = false; // reset tiap kali jobId berubah

    async function poll() {
      try {
        const data = await api.getJobStatus(jobId!);
        if (cancelled) return;
        setJob(data);
        setError(null);

        // Auto-trigger klasifikasi saat selesai — dijaga hasClassified.current
        // agar tidak dijalankan lebih dari sekali meski poll() dipanggil berulang
        if (data.status === "completed" && !hasClassified.current) {
          hasClassified.current = true; // set SEBELUM await agar poll berikutnya skip
          setClassifying(true);
          try {
            const result = await api.classifyJob(jobId!, 0.60);
            if (!cancelled) setClassifyResult(result);
          } catch (err) {
            hasClassified.current = false; // izinkan retry kalau error
            if (!cancelled) {
              setError(err instanceof ApiClientError ? err.detail : "Klasifikasi gagal");
            }
          } finally {
            if (!cancelled) setClassifying(false);
          }
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiClientError ? err.detail : "Tidak bisa fetch status");
      }
    }

    // Poll pertama kali langsung
    poll();

    // Polling tiap 5 detik — poll() sendiri yang skip kalau sudah selesai
    const interval = setInterval(poll, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [jobId]); // HANYA jobId — tidak ada dependency lain

  // Auto-redirect ke hasil saat klasifikasi selesai
  useEffect(() => {
    if (classifyResult) {
      router.push(`/results/${classifyResult.timestamp}`);
    }
  }, [classifyResult, router]);

  if (!jobId) {
    return <LoadingState message="Memuat..." />;
  }

  if (error && !job) {
    return <ErrorState message={error} />;
  }

  if (!job) {
    return <LoadingState message="Memuat status job..." />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/upload">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Upload
        </Button>
      </Link>

      <div>
        <p className="font-mono text-xs text-slate-500">Job ID</p>
        <p className="font-mono text-sm font-medium text-slate-900">{job.job_id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon status={job.status} />
            Status: {statusLabel(job.status)}
          </CardTitle>
          <CardDescription>
            {job.n_images} foto dipindahkan ke server pada {new Date(job.created_at).toLocaleString("id-ID")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          {(job.status === "queued" || job.status === "running") && (
            <ProgressBar
              value={job.progress}
              label="Progress Stitching ODM"
              status={job.message}
            />
          )}

          {/* Completed → menampilkan info classify */}
          {job.status === "completed" && (
            <div className="space-y-3">
              <ProgressBar value={100} label="Stitching" status="Selesai" />
              {classifying && (
                <div className="flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-900">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memulai klasifikasi HSV otomatis...
                </div>
              )}
              {job.orthophoto_path && (
                <p className="font-mono text-xs text-slate-500">
                  Orthophoto: {job.orthophoto_path}
                </p>
              )}
            </div>
          )}

          {/* Failed */}
          {job.status === "failed" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="font-semibold text-red-900">Stitching gagal</p>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs text-red-800">
                {job.error}
              </pre>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Catatan: {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-xs text-blue-900">
            <strong>Catatan:</strong> Stitching ODM lokal di laptop biasanya makan
            10-60 menit. Anda dapat menutup tab ini dan kembali nanti dengan URL
            yang sama (job_id disimpan di server selama session). Polling otomatis
            setiap 5 detik.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusIcon({ status }: { status: JobInfo["status"] }) {
  if (status === "queued") return <Clock className="h-5 w-5 text-slate-500" />;
  if (status === "running") return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
  if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-green-700" />;
  if (status === "failed") return <XCircle className="h-5 w-5 text-red-600" />;
  return null;
}

function statusLabel(status: JobInfo["status"]): string {
  return {
    queued: "Menunggu antrian",
    running: "Stitching berjalan",
    completed: "Stitching selesai",
    failed: "Gagal",
  }[status];
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-slate-600">
      <Loader2 className="h-5 w-5 animate-spin" />
      <p>{message}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="pt-6">
        <p className="text-red-900">{message}</p>
      </CardContent>
    </Card>
  );
}
