/**
 * types/georaster.d.ts
 * ================================================================
 * Deklarasi module untuk library georaster & georaster-layer-for-leaflet
 * yang tidak menyediakan TypeScript types sendiri.
 *
 * Type-nya minimal & longgar — cukup agar TypeScript tidak komplain.
 * Untuk type yang lebih ketat, bisa diperluas sesuai kebutuhan.
 * ================================================================
 */
// Izinkan side-effect import CSS (misal: import "leaflet/dist/leaflet.css")
declare module "*.css" {}

declare module "georaster" {
  // parseGeoraster menerima ArrayBuffer (atau file path di Node) dan
  // return Promise georaster object yang berisi metadata + raster values
  const parseGeoraster: (data: ArrayBuffer | string) => Promise<unknown>;
  export default parseGeoraster;
}

declare module "georaster-layer-for-leaflet" {
  import L from "leaflet";

  interface GeoRasterLayerOptions extends L.LayerOptions {
    georaster: unknown;
    opacity?: number;
    resolution?: number;
    /** Custom function: ubah array nilai piksel → warna CSS atau null untuk transparan */
    pixelValuesToColorFn?: (values: number[]) => string | null;
  }

  class GeoRasterLayer extends L.Layer {
    constructor(options: GeoRasterLayerOptions);
  }

  export default GeoRasterLayer;
}
