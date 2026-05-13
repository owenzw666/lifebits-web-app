import { useEffect, useRef, useState } from "react";
import maplibregl, { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getNotesApi } from "../api/notesApi";
import type { GeoJsonFeatureCollection } from "../types/geojson";

const MapView = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  //记录记事
  const [featuresGeoJson, setFeaturesGeoJson] =
    useState<GeoJsonFeatureCollection>({
      type: "FeatureCollection",
      features: [],
    });

  //获取所有记事
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const data = await getNotesApi();
        setFeaturesGeoJson(data);
      } catch (error) {
        console.error("Failed to get notes：", error);
      }
    };
    fetchFeatures();
  }, []);

  const [mapLoaded, setMapLoaded] = useState(false);

  //初始化地图
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [174.7762, -41.2865],
      zoom: 12,
    });
    mapRef.current = map;

    map.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  //添加记事图层到地图上
  useEffect(() => {
    if (!mapLoaded) return;
    if (!mapRef.current) return;
    const map = mapRef.current;
    console.info(JSON.stringify(featuresGeoJson), null, 2);
    const source = map.getSource("notes");
    if (!source) {
      map.addSource("notes", {
        type: "geojson",
        data: featuresGeoJson,
      });
      map.addLayer({
        id: "notes-layer",
        type: "circle",
        source: "notes",
        paint: {
          "circle-radius": 6,
          "circle-color": "#bd0ec0",
        },
      });
    } else {
      (source as GeoJSONSource).setData(featuresGeoJson);
    }
  }, [featuresGeoJson, mapLoaded]);

  return <div ref={mapContainer} style={{ height: "100%" }} />;
};

export default MapView;
