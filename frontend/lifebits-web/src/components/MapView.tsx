import { useEffect, useRef, useState } from "react";
import maplibregl, { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  GeoJsonFeature,
  GeoJsonFeatureCollection,
} from "../types/geojson";

interface MapViewProps {
  featuresGeoJson: GeoJsonFeatureCollection;

  selectedFeature: GeoJsonFeature | null;

  onSelectFeature: (feature: GeoJsonFeature | null) => void;
}

const MapView = ({
  featuresGeoJson,
  selectedFeature,
  onSelectFeature,
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  //初始化地图
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [174.7762, -41.2865],
      zoom: 12,
    });
    mapRef.current = map;

    map.on("load", () => {
      //console.log(JSON.stringify(featuresGeoJson,null,2));
      map.addSource("notes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addSource("selected-note", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "notes",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#3b82f6",
          "circle-radius": 18,
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "notes",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "notes",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#bd0ec0",
          "circle-radius": 6,
        },
      });

      map.addLayer({
        id: "selected-note-layer",
        type: "circle",
        source: "selected-note",
        paint: {
          "circle-radius": 12,
          "circle-color": "#ef4444",
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      setMapLoaded(true);
    });

    map.on("click", "clusters", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });

      const clusterId = features[0].properties.cluster_id;

      const source = map.getSource("notes") as any;

      source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return;

        map.easeTo({
          center: (features[0].geometry as any).coordinates,
          zoom,
        });
      });
    });

    map.on("click", "unclustered-point", (e) => {
      const feature = e.features?.[0];

      if (!feature) return;

      onSelectFeature(feature as any);
    });

    map.on("mouseenter", "clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "clusters", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => map.remove();
  }, []);

  //添加记事图层到地图上
  useEffect(() => {
    if (!mapLoaded) return;
    if (!mapRef.current) return;

    const source = mapRef.current.getSource("notes") as
      | GeoJSONSource
      | undefined;
    if (!source) return;

    source.setData(featuresGeoJson);
  }, [featuresGeoJson, mapLoaded]);

  //添加 selectedFeature 到地图的选择要素图层里面
  useEffect(() => {
    if (!mapRef.current) return;

    const source = mapRef.current.getSource("selected-note") as
      | GeoJSONSource
      | undefined;

    if (!source) return;

    if (!selectedFeature) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });

      return;
    }

    source.setData({
      type: "FeatureCollection",
      features: [selectedFeature],
    });
  }, [selectedFeature]);

  //聚焦到选择的记事
  useEffect(() => {
  if (!mapRef.current) return;
  if (!selectedFeature) return;

  const [lng, lat] =
    selectedFeature.geometry.coordinates;

  mapRef.current.flyTo({
    center: [lng, lat],
    zoom: 15,
    duration: 800,
  });

}, [selectedFeature]);

  return <div ref={mapContainer} style={{ height: "100%" }} />;
};

export default MapView;
