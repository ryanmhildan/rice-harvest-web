# Rice Harvest Detection — Frontend Next.js

Frontend untuk Sistem Deteksi Kesiapan Panen Padi via Citra Drone.
Skripsi Teknik Informatika UNIKOM 2026 — Ryan Muhammad Hildan (NIM 10122475).

## Bagian dari Sistem Tiga Lapis

```
[1] Next.js Frontend (port 3001)   ← FOLDER INI
        ↕ HTTP
[2] FastAPI Backend (port 8000)    ← lihat folder rice_classification_api/
        ↕ PyODM
[3] NodeODM Docker (port 3000)     ← lihat folder rice_orthophoto_pipeline/
```

## Quick Start

### Prasyarat
- Node.js 18.18+ atau 20+ (sudah terpasang: tested di v22.22)
- Backend FastAPI berjalan di port 8000

### Setup
```bash
# Install dependencies (sekali saja setelah clone)
npm install --legacy-peer-deps

# Pastikan backend jalan: lihat folder rice_classification_api
# Lalu jalankan dev server
npm run dev
```

Buka **http://localhost:3001** di browser.

## Halaman

| URL | Fungsi |
|---|---|
| `/` | Beranda — overview sistem + status monitor |
| `/upload` | Upload foto drone + atur threshold |
| `/jobs/<jobId>` | Status stitching dengan progress polling |
| `/results` | Riwayat semua hasil klasifikasi |
| `/results/<timestamp>` | Detail hasil dengan peta Leaflet |
| `/status` | Monitoring backend + NodeODM |

## Stack

- Next.js 15.5.7 (App Router) + React 19 + TypeScript
- Tailwind CSS 3.4 + lucide-react + clsx
- react-leaflet 5.0 untuk peta interaktif

## Dokumentasi

- **CLAUDE.md** — context lengkap untuk AI assistant
- **FRONTEND_GUIDE.md** — penjelasan konsep React/Next.js untuk pemula
- **BACKEND_API.md** — kontrak API (di folder backend)

## Build untuk Production

```bash
npm run build      # build production
npm start          # jalankan production server
```
