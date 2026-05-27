# CLAUDE.md — Frontend Next.js

> Project context untuk Claude Code & AI assistant. Dibaca otomatis di awal setiap sesi.

## 1. Tentang Proyek Ini

Frontend Next.js untuk skripsi **Sistem Deteksi Kesiapan Panen Padi** oleh **Ryan Muhammad Hildan (NIM 10122475)** — UNIKOM 2026.

Frontend ini adalah **bagian 1 dari 3** arsitektur sistem skripsi:

```
[1] Next.js Frontend (port 3001)   ← FOLDER INI
        ↕ HTTP
[2] FastAPI Backend (port 8000)
        ↕ PyODM
[3] NodeODM Docker (port 3000)
```

Tugas frontend: terima input user (upload foto, threshold) → panggil backend FastAPI → tampilkan progress + hasil dengan peta interaktif Leaflet.

## 2. Filosofi Arsitektur

1. **UI only** — frontend tidak melakukan image processing apapun. Semua di backend.
2. **App Router** (Next.js 15) — terbaru, lebih sedikit boilerplate, konsisten dengan ekosistem 2024-2026.
3. **Client Components dominan** — karena banyak interaktivitas (form, state, polling). Tidak banyak SEO benefit dari SSR untuk skripsi.
4. **TypeScript strict** — type safety dari kontrak API backend.
5. **Tailwind CSS only** — tidak pakai UI library besar (Material-UI, dll) supaya bundle ringan.

## 3. Stack

- **Next.js 15.5.7** + **React 19.0.0** + **TypeScript 5.9**
- **Tailwind CSS 3.4** untuk styling
- **react-leaflet 5.0** + **leaflet 1.9** untuk peta interaktif
- **lucide-react** untuk ikon
- **clsx + tailwind-merge** untuk class composition

## 4. Struktur Folder

```
rice-harvest-web/
├── app/                            ← App Router pages
│   ├── layout.tsx                  ← Root layout (NavBar + footer)
│   ├── page.tsx                    ← "/" beranda
│   ├── globals.css                 ← Tailwind + custom CSS
│   ├── upload/page.tsx             ← "/upload" form upload
│   ├── jobs/[jobId]/page.tsx       ← "/jobs/<id>" status polling
│   ├── results/page.tsx            ← "/results" list riwayat
│   ├── results/[timestamp]/page.tsx ← "/results/<ts>" detail + peta
│   └── status/page.tsx             ← "/status" monitoring dashboard
├── components/
│   ├── ui/                         ← Komponen UI generik
│   │   ├── button.tsx
│   │   └── card.tsx
│   ├── nav-bar.tsx
│   ├── system-status.tsx           ← Polling backend status
│   ├── upload-dropzone.tsx         ← Drag-drop multi-file
│   ├── progress-bar.tsx
│   ├── verdict-banner.tsx          ← Banner besar SIAP/BELUM
│   ├── stats-panel.tsx
│   └── map-view.tsx                ← Leaflet wrapper (dynamic import)
├── lib/
│   ├── api.ts                      ← Client untuk fetch FastAPI
│   ├── types.ts                    ← TS types match BACKEND_API.md
│   └── utils.ts                    ← cn(), formatPct, dll
├── public/                         ← Static assets
├── .env.local                      ← NEXT_PUBLIC_API_URL
├── CLAUDE.md                       ← Dokumen ini
├── FRONTEND_GUIDE.md               ← Penjelasan konsep React/Next.js
└── ... (config files)
```

## 5. Konsep React/Next.js yang DIPAKAI Project Ini

Wajib paham (untuk jawab sidang):

### `"use client"` directive
- Pakai di top file kalau komponen butuh: useState, useEffect, useRef, event handler, hooks
- Tanpa "use client" = Server Component (default), tidak bisa pakai interaksi browser
- Layout.tsx kita: Server Component (tidak butuh interaksi)
- Sebagian besar pages: Client Component

### Hooks
- **useState**: simpan state lokal (files, threshold, error)
- **useEffect**: side-effects (fetch on mount, polling interval, cleanup)
- **useRef**: akses langsung DOM element (untuk trigger file input)
- **usePathname** (next/navigation): deteksi URL aktif untuk highlight nav
- **useRouter** (next/navigation): programmatic navigation (router.push)

### Dynamic Import + ssr: false
Leaflet butuh `window`, tapi Next.js coba render di server. Solusinya:
```typescript
const MapView = dynamic(
  () => import("@/components/map-view").then((mod) => mod.MapView),
  { ssr: false, loading: () => <SkeletonLoader /> }
);
```
Tanpa ini, halaman crash dengan "window is not defined".

### Dynamic Routes
Folder `[jobId]/page.tsx` menerima parameter dari URL:
```typescript
interface PageProps {
  params: Promise<{ jobId: string }>;
}
```
Next.js 15: params adalah Promise, perlu unwrap dengan `.then()` atau `use()` hook.

### Polling Pattern
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchStatus();
  }, 5000);
  return () => clearInterval(interval); // cleanup wajib
}, []);
```
Cleanup function di return WAJIB untuk hindari memory leak.

## 6. Cara Menjalankan

### Pertama kali
```bash
npm install              # install dependencies
```

### Selanjutnya
```bash
npm run dev              # development server di port 3001
# atau
npm run build && npm start  # production mode
```

Buka http://localhost:3001 di browser.

**Prasyarat**: backend FastAPI harus jalan di port 8000 (lihat folder `rice_classification_api/`).

## 7. Environment Variables

File `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Catatan: `NEXT_PUBLIC_` prefix bikin variabel ini accessible dari client-side bundle. Tanpa prefix, hanya server-side.

## 8. Gaya Kode

1. **Komentar inline dalam Bahasa Indonesia**, plus penjelasan singkat konsep React/Next.js untuk konteks belajar.
2. **TypeScript strict** — tidak boleh `any` kecuali sangat terpaksa.
3. **Import alias** `@/` → root proyek. Contoh: `import { api } from "@/lib/api"`.
4. **Tailwind utility classes** — jangan pakai inline `style={}` kecuali untuk nilai dinamis.
5. **Komponen kecil & fokus** — split kalau komponen > 200 baris.

## 9. Endpoint Backend yang Dipakai

Semua via `@/lib/api`:

| Method | Endpoint | Fungsi |
|---|---|---|
| `api.getHealth()` | `GET /health` | Polling status backend (tiap 10 detik di SystemStatus) |
| `api.getNodeODMStatus()` | `GET /nodeodm/status` | Cek NodeODM (polling sama) |
| `api.submitStitchJob(files, threshold)` | `POST /jobs/stitch` | Upload foto + mulai stitching |
| `api.getJobStatus(jobId)` | `GET /jobs/{jobId}` | Polling status job (tiap 5 detik) |
| `api.classifyJob(jobId, threshold)` | `POST /jobs/{jobId}/classify` | Klasifikasi setelah stitching |
| `api.classifyDirect(path, threshold)` | `POST /classify` | Klasifikasi langsung |
| `api.listResults()` | `GET /results` | List riwayat |
| `api.fileUrl(kategori, nama)` | `GET /files/{kat}/{nama}` | URL file untuk `<img>` atau download |

Lihat detail di `BACKEND_API.md` (folder backend).

## 10. Known Issues & Solutions

| Issue | Penyebab | Solusi |
|---|---|---|
| Halaman blank, console error "window is not defined" | Komponen pakai Leaflet/window tanpa dynamic import | Pakai `dynamic()` dengan `ssr: false` |
| CORS error saat fetch | Backend belum allow origin Next.js | Edit `allow_origins` di `api.py` backend |
| `npm install` gagal versi React conflict | Peer deps mismatch | Pakai flag `--legacy-peer-deps` |
| Port 3001 sudah dipakai | Process lain pakai port | `npm run dev -- -p 3002` |
| TypeScript error setelah edit `BACKEND_API.md` | Type out of sync | Sync types di `lib/types.ts` |
| Leaflet marker icon hilang | Default icon dari CDN, tapi path issue Next.js | Tambah `import "leaflet/dist/leaflet.css"` di komponen |
| `npm run build` warning React 19 untested | React 19 baru | Aman diabaikan, atau lock React ke 19.0.0 |

## 11. Roadmap Pengembangan

| Status | Fitur | Priority |
|---|---|---|
| ✅ | Layout + navigation + halaman beranda | P0 |
| ✅ | Upload multi-file dengan drag-drop | P0 |
| ✅ | Status polling untuk job stitching | P0 |
| ✅ | Halaman detail hasil + Leaflet map | P0 |
| ✅ | Riwayat list + detail | P0 |
| ✅ | Status monitoring | P0 |
| ⏳ | Slider threshold re-classify tanpa re-stitch | P1 |
| ⏳ | Toast/notification system | P1 |
| ⏳ | Error boundary global | P1 |
| 🔮 | WebSocket real-time progress | P2 |
| 🔮 | Authentication (kalau perlu) | P3 |
| 🔮 | Theme dark mode | P3 |

## 12. Catatan Akademis (Untuk Sidang)

### Justifikasi Pilihan Next.js

> "Next.js dipilih sebagai frontend framework karena: (1) App Router-nya menyediakan file-based routing yang intuitif untuk skala skripsi, (2) integrasi TypeScript native untuk type safety dari kontrak API backend, (3) ekosistem React + Tailwind + lucide-react matang untuk UI modern, (4) bundle size dapat dioptimasi otomatis untuk performa client. Pemilihan ini juga sejalan dengan rekan se-skripsi yang mengerjakan modul drone autopilot, sehingga konsistensi stack memudahkan integrasi."

### Justifikasi Arsitektur Terpisah Frontend-Backend

> "Pemisahan frontend (Next.js) dan backend (FastAPI) mengikuti prinsip *separation of concerns*. Frontend fokus pada UI/UX dan tidak melakukan komputasi berat; backend Python fokus pada pemrosesan citra dengan ekosistem matang (OpenCV, rasterio, PyODM). Komunikasi via HTTP REST localhost — sesuai paradigma edge computing tanpa cloud."

### Pertanyaan yang Mungkin Ditanya Penguji

1. **"Apa beda Server Component vs Client Component?"**
   - Server Component: di-render di Node.js, tidak butuh JS ke browser, lebih cepat, tidak bisa pakai state/effect/hook.
   - Client Component: di-render di browser, butuh JS dikirim ke client, bisa interaktif (state, event).
   - Default = Server Component. Pakai `"use client"` untuk pindah ke Client.

2. **"Kenapa Leaflet butuh dynamic import?"**
   - Leaflet akses `window.document` di import-time, tapi Next.js coba pre-render di Node.js (no window).
   - Solusi: `dynamic(() => import(...), { ssr: false })` membuat komponen hanya di-render di browser.

3. **"Kenapa polling, bukan WebSocket?"**
   - Polling 5 detik untuk stitching yang 10-60 menit = overhead minimal (~1 KB/poll).
   - WebSocket lebih kompleks untuk setup (butuh ASGI di FastAPI, library client). Untuk skripsi, polling sudah memadai.

4. **"Apa itu Tailwind CSS?"**
   - Utility-first CSS framework. Bukan komponen jadi, tapi class kecil-kecil seperti `bg-green-700`, `p-4`, `rounded-md` yang digabung untuk styling cepat tanpa file CSS terpisah.

5. **"Kenapa pakai TypeScript, bukan JavaScript?"**
   - Type safety di compile-time, autocomplete IDE jauh lebih bagus, refactor lebih aman, dokumentasi otomatis dari signature function.

## 13. Catatan untuk Rekan Se-skripsi

Rekan mengerjakan autonomous drone juga pakai Next.js. **Best practices untuk konsistensi:**

1. **Pakai App Router** (folder `app/`, bukan `pages/`)
2. **TypeScript strict** — sama dengan project ini
3. **Tailwind CSS** untuk styling — hindari CSS Modules atau styled-components
4. **Kontrak data via JSON file di folder shared** atau via API endpoint

Kalau ingin integrasi UI nantinya:
- Buat repository monorepo dengan workspace npm/pnpm
- Atau buat shared component package
- Atau yang paling sederhana: copy-paste komponen yang dipakai bareng

## 14. Resources Belajar Next.js untuk Pemula

Saya rekomendasikan urutan ini:

1. **Next.js Official Tutorial** (~2 jam) — https://nextjs.org/learn
2. **React docs - Quick Start** (~1 jam) — https://react.dev/learn
3. **Tailwind docs - Utility-First** (~30 menit) — https://tailwindcss.com/docs/utility-first
4. **TypeScript handbook - Basics** (~1 jam) — https://www.typescriptlang.org/docs/handbook/2/basic-types.html

Setelah 4-5 jam belajar, Anda sudah cukup untuk modifikasi project ini.
