/**
 * lib/api.ts
 * ================================================================
 * Client untuk berkomunikasi dengan FastAPI backend.
 *
 * Semua fungsi di sini WRAPPER untuk fetch() agar:
 *   1. URL backend tidak hardcoded di mana-mana
 *   2. Type safety: response sudah ber-typed sesuai BACKEND_API.md
 *   3. Error handling konsisten
 *
 * Cara pakai di komponen:
 *   import { api } from "@/lib/api";
 *   const data = await api.getHealth();
 * ================================================================
 */

import type {
  JobInfo,
  ClassificationResult,
  ResultListResponse,
  NodeODMInfo,
  HealthInfo,
} from "./types";

/**
 * Base URL backend FastAPI — hanya untuk server-side (Next.js API routes).
 * Client-side JANGAN pakai langsung karena kena CORS + IDM extension.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Prefix proxy same-origin untuk browser fetch().
 * Semua panggilan API dari browser diarahkan ke /api/backend/...
 * Next.js server yang meneruskan ke API_BASE (server-to-server, bebas CORS/IDM).
 */
const PROXY_BASE = "/api/backend";

/**
 * Custom error class untuk membedakan API error dari error lain.
 */
export class ApiClientError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(`API Error ${status}: ${detail}`);
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Helper internal: panggil fetch + handle error standar FastAPI.
 *
 * KENAPA TIDAK PAKAI axios? Modern fetch() sudah cukup, plus
 * tidak perlu install dependency tambahan.
 */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PROXY_BASE}${path}`;

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    // Network error (server down, CORS, dll)
    throw new ApiClientError(
      0,
      `Tidak bisa terhubung ke backend di ${API_BASE}. ` +
      `Pastikan FastAPI server berjalan (start_api.bat).`
    );
  }

  // Parse body sekali
  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { detail: text || "Response bukan JSON yang valid" };
  }

  if (!response.ok) {
    const detail = (data as { detail?: string })?.detail ?? response.statusText;
    throw new ApiClientError(response.status, detail);
  }

  return data as T;
}

/**
 * API client — semua fungsi yang bisa dipanggil ke backend.
 */
export const api = {
  /** Cek kesehatan backend. */
  getHealth(): Promise<HealthInfo> {
    return request<HealthInfo>("/health");
  },

  /** Cek status NodeODM. Lempar ApiClientError(503) kalau down. */
  getNodeODMStatus(): Promise<NodeODMInfo> {
    return request<NodeODMInfo>("/nodeodm/status");
  },

  /**
   * Upload foto drone + mulai stitching.
   * Returns: JobInfo dengan job_id untuk polling.
   *
   * @param files - array File dari input atau drag-drop
   * @param threshold - ambang siap panen (default 0.60)
   */
  submitStitchJob(files: File[], threshold: number = 0.60): Promise<JobInfo> {
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    formData.append("threshold", threshold.toString());

    return request<JobInfo>("/jobs/stitch", {
      method: "POST",
      body: formData,
      // JANGAN set Content-Type — browser otomatis set dengan boundary
      // yang benar untuk multipart/form-data
    });
  },

  /** Polling status job stitching. */
  getJobStatus(jobId: string): Promise<JobInfo> {
    return request<JobInfo>(`/jobs/${jobId}`);
  },

  /** Klasifikasi setelah stitching selesai. */
  classifyJob(jobId: string, threshold: number = 0.60): Promise<ClassificationResult> {
    return request<ClassificationResult>(
      `/jobs/${jobId}/classify?threshold=${threshold}`,
      { method: "POST" }
    );
  },

  /** Klasifikasi orthophoto yang sudah ada di server. */
  classifyDirect(
    orthophotoPath: string,
    threshold: number = 0.60
  ): Promise<ClassificationResult> {
    return request<ClassificationResult>("/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orthophoto_path: orthophotoPath,
        threshold,
      }),
    });
  },

  /** List semua hasil klasifikasi sebelumnya. */
  listResults(): Promise<ResultListResponse> {
    return request<ResultListResponse>("/results");
  },

  /**
   * Bangun URL untuk file output (misal PNG visualisasi).
   * Pakai proxy /api/files/... agar bebas dari CORS dan IDM extension.
   */
  fileUrl(
    kategori: "orthophoto" | "classification" | "visualization" | "results"
           | "orthophoto_web" | "classification_web",
    namaFile: string,
  ): string {
    return `/api/files/${kategori}/${encodeURIComponent(namaFile)}`;
  },

  /** Base URL backend asli (untuk keperluan server-side). */
  get baseUrl(): string {
    return API_BASE;
  },
};
