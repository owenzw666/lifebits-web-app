import { useEffect, useRef, useState } from "react";
import maplibregl, { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  PlaceFeature,
  PlaceFeatureCollection,
} from "../types/geojson";

interface PointGeometry {
  coordinates: [number, number];
}

interface MapViewProps {
  placesGeoJson: PlaceFeatureCollection;
  selectedPlace: PlaceFeature | null;
  onSelectPlaceId: (placeId: number) => void;
  onCreateAtLocation: (lng: number, lat: number) => void;
}

const emptyFeatureCollection: PlaceFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const MapView = ({
  placesGeoJson,
  selectedPlace,
  onSelectPlaceId,
  onCreateAtLocation,
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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
      map.addSource("places", {
        type: "geojson",
        data: emptyFeatureCollection,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addSource("selected-place", {
        type: "geojson",
        data: emptyFeatureCollection,
      });

      map.addLayer({
        id: "place-clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#2563eb",
          "circle-radius": 18,
        },
      });

      map.addLayer({
        id: "place-cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "place-points",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#2563eb",
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "noteCount"],
            1,
            7,
            10,
            13,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "place-note-count",
        type: "symbol",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["to-string", ["get", "noteCount"]],
          "text-size": 11,
          "text-font": ["Noto Sans Regular"],
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "selected-place-layer",
        type: "circle",
        source: "selected-place",
        paint: {
          "circle-radius": 16,
          "circle-color": "#ef4444",
          "circle-stroke-width": 4,
          "circle-stroke-color": "#ffffff",
        },
      });

      setMapLoaded(true);
    });

    map.on("click", "place-clusters", async (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["place-clusters"],
      });
      const clusterId = features[0].properties?.cluster_id;
      const source = map.getSource("places") as GeoJSONSource;

      const zoom = await source.getClusterExpansionZoom(clusterId);

      map.easeTo({
        center: (features[0].geometry as unknown as PointGeometry).coordinates,
        zoom,
      });
    });

    map.on("click", "place-points", (event) => {
      const placeId = event.features?.[0].properties?.placeId;

      if (typeof placeId === "number") {
        onSelectPlaceId(placeId);
      }
    });

    map.on("click", (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["place-clusters", "place-points"],
      });

      // If the user clicked an existing marker, the marker handler owns that click.
      if (features.length > 0) return;

      onCreateAtLocation(event.lngLat.lng, event.lngLat.lat);
    });

    map.on("mouseenter", "place-clusters", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseenter", "place-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "place-clusters", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("mouseleave", "place-points", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => map.remove();
  }, [onCreateAtLocation, onSelectPlaceId]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const source = mapRef.current.getSource("places") as
      | GeoJSONSource
      | undefined;

    source?.setData(placesGeoJson);
  }, [mapLoaded, placesGeoJson]);

  useEffect(() => {
    if (!mapRef.current) return;

    const source = mapRef.current.getSource("selected-place") as
      | GeoJSONSource
      | undefined;

    if (!source) return;

    source.setData(
      selectedPlace
        ? {
            type: "FeatureCollection",
            features: [selectedPlace],
          }
        : emptyFeatureCollection,
    );
  }, [selectedPlace]);

  useEffect(() => {
    if (!mapRef.current || !selectedPlace) return;

    const [lng, lat] = selectedPlace.geometry.coordinates;

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 700,
    });
  }, [selectedPlace]);

  return <div ref={mapContainer} style={{ height: "100%" }} />;
};

export default MapView;
