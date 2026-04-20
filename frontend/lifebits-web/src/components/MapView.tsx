import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [174.7762, -41.2865], // Wellington
      zoom: 10,
    });

    return () => map.remove();
  }, []);

  return <div ref={mapContainer} style={{ height: "100%" }} />;
};

export default MapView;