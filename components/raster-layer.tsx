"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import parseGeoraster from "georaster";
import GeoRasterLayer from "georaster-layer-for-leaflet";

interface RasterLayerProps {
  url: string;
}

export function RasterLayer({ url }: RasterLayerProps) {
  const map = useMap();
console.log("rester ",url)
  useEffect(() => {
    let layer: GeoRasterLayer | null = null;

    async function loadRaster() {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        const georaster = await parseGeoraster(arrayBuffer);

        console.log("georaster", georaster);

        layer = new GeoRasterLayer({
          georaster,
          opacity: 0.7,
          resolution: 256,
        });

        layer.addTo(map);

        map.fitBounds((layer as any).getBounds());
      } catch (err) {
        console.error("FAILED TO LOAD RASTER", err);
      }
    }

    loadRaster();

    return () => {
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [map, url]);

  return null;
}