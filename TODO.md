# TODO - tampilkan GeoTIFF (.tif/.tiff) di React-Leaflet

## Rencana perbaikan
1. Update `components/map-view.tsx`:
   - Tambah support layer GeoTIFF/GeoRaster via `georaster` + `georaster-layer-for-leaflet`.
   - Load GeoTIFF dari URL backend lewat proxy `/api/files/...` supaya tidak kena CORS.
   - Render 2 layer: orthophoto (di bawah) + klasifikasi (di atas), lengkap dengan toggle & opacity.

2. Update `app/results/[timestamp]/page.tsx`:
   - Pastikan `fallbackImageUrl` (PNG) tetap ada untuk fallback bila GeoTIFF gagal.
   - Tambahkan prop untuk orthophoto/classification TIFF URL ke `MapView`.

3. Pastikan CORS & MIME:
   - Karena sudah ada proxy `app/api/files/[...path]/route.ts`, pastikan file `.tif` yang diproxy mengirim `Content-Type` yang benar (minimal `application/octet-stream`).

4. Testing:
   - Jalankan `npm run dev`, buka page hasil.
   - Verifikasi layer tampil, posisi bounds benar.

5. Debug bila masih gagal:
   - Tangkap error dari `parseGeoraster` dan tampilkan di console.
   - Jika perlu, add mekanisme pembacaan bounds dari metadata georaster.
