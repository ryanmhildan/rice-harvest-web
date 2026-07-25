/**
 * lib/types.ts
 * ================================================================
 * TypeScript types yang merefleksikan kontrak API backend (FastAPI).
 *
 * Sumber kebenaran: BACKEND_API.md di folder rice_classification_api.
 * Jika backend berubah, file ini WAJIB di-update.
 *
 * KENAPA TypeScript DAN BUKAN JavaScript?
 * TypeScript menambah type checking sebelum runtime. Misalnya kalau
 * backend kirim { verdict: "SIAP PANEN" } dan kita salah ketik
 *   data.verdic   ← typo
 * Compiler langsung kasih error sebelum aplikasi jalan.
 * ================================================================
 */

/**
 * Status job stitching ODM.
 * Lifecycle: queued → running → (completed | failed)
 */
export type JobStatus = "queued" | "running" | "completed" | "failed";

/**
 * Verdict klasifikasi (cuma 2 kelas sesuai arahan dosbing).
 */
export type Verdict = "SIAP PANEN" | "BELUM SIAP PANEN";

/**
 * Info job stitching, response dari:
 *   POST /jobs/stitch
 *   GET  /jobs/{job_id}
 */
export interface JobInfo {
  job_id: string;
  status: JobStatus;
  progress: number;              // 0-100
  message: string;
  created_at: string;            // ISO 8601
  n_images: number;
  orthophoto_path: string | null; // ada saat status="completed"
  error: string | null;          // ada saat status="failed"
}

/**
 * Statistik hasil klasifikasi (whole-orthophoto).
 */
export interface ClassificationStats {
  n_pixels_total: number;
  n_pixels_valid: number;
  n_pixels_rice: number;
  n_pixels_yellow: number;
  n_pixels_green: number;
  yellow_pct_of_rice: number;
  green_pct_of_rice: number;
  valid_pct_of_total: number;
  rice_pct_of_valid: number;
  threshold_used: number;
  verdict: Verdict;
  verdict_class: 1 | 2;
  confidence_margin_pp: number;  // jarak dari threshold (percentage points)
}

/**
 * Response lengkap dari:
 *   POST /classify
 *   POST /jobs/{job_id}/classify
 */
export interface ClassificationResult extends ClassificationStats {
  success: boolean;
  timestamp: string;             // YYYYMMDD_HHMMSS
  job_id: string | null;
  orthophoto_file: string;
  orthophoto_width: number;
  orthophoto_height: number;
  crs: string;                   // "EPSG:4326"
  bounds: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  files: {
    orthophoto: string;                      // GeoTIFF resolusi penuh — untuk download QGIS
    classification: string;                  // GeoTIFF klasifikasi — untuk download QGIS
    orthophoto_web_png: string;              // PNG RGBA orthophoto — untuk Leaflet ImageOverlay
    classification_overlay_png: string;      // PNG RGBA overlay kuning/hijau — untuk Leaflet ImageOverlay
    visualization: string;                   // PNG visualisasi lengkap (dengan banner & legend)
  };
  /** Bounds dalam WGS84 [minLon, minLat, maxLon, maxLat] — selalu ada di hasil baru. */
  bounds_wgs84?: [number, number, number, number];
  duration_seconds: number;
}

/**
 * Entri ringkas di halaman riwayat (GET /results).
 */
export interface ResultListItem {
  filename: string;
  timestamp: string;
  verdict: Verdict;
  yellow_pct: number;
  threshold: number;
}

/**
 * Response dari GET /results
 */
export interface ResultListResponse {
  count: number;
  results: ResultListItem[];
}

/**
 * Response dari GET /nodeodm/status saat NodeODM jalan.
 */
export interface NodeODMInfo {
  ok: boolean;
  version: string;
  engine: string;
  engine_version: string;
  max_parallel_tasks: number;
  task_queue_count: number;
}

/**
 * Response dari GET /health
 */
export interface HealthInfo {
  status: "ok";
  timestamp: string;
  output_dir_exists: boolean;
  active_jobs: number;
  total_jobs: number;
}

/**
 * Error response standar FastAPI.
 */
export interface ApiError {
  detail: string;
}

/**
 * Data lahan yang terdaftar di database.
 * Response dari GET /api/lahan
 */
export interface Lahan {
  id_lahan: number;
  nama_lahan: string;
  latitude: number;
  longitude: number;
  luas_estimasi_ha: number;
  created_at: string;          // ISO 8601
}

/**
 * Satu baris histori deteksi dari database.
 * Response dari GET /api/lahan/{id}/riwayat  dan  GET /api/riwayat
 *
 * Catatan threshold: disimpan sebagai desimal 0.0–1.0 (mis. 0.60 = 60%).
 * Catatan persentase_kematangan: sudah dalam bentuk persen 0–100.
 */
export interface RiwayatDeteksi {
  id_deteksi: number;
  id_lahan: number;
  timestamp: string;                                    // YYYYMMDD_HHMMSS atau ISO 8601
  verdict: Verdict;
  verdict_class: 1 | 2;
  persentase_kematangan: number;                        // 0–100
  threshold: number;                                    // 0.0–1.0
  confidence_margin_pp: number;                         // percentage points
  crs: string;                                          // mis. "EPSG:4326"
  bounds_wgs84: [number, number, number, number] | null; // [minLon,minLat,maxLon,maxLat]
}
