import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Note } from "../api/notesApi";
import NoteFormPopup from "./NoteFormPopup";

interface MapViewProps {
  notes: Note[];
  onAddNote: (data: {
  title: string;
  content: string;
  lat: number;
  lng: number;
  eventTime: string;}) => void;
}

const MapView = ({ notes, onAddNote }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [popupData, setPopupData] = useState<{
  lat: number;
  lng: number;
} | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [174.7762, -41.2865],
      zoom: 12,
    });

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setPopupData({ lat, lng });
    });
    mapRef.current = map;

    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const markers: maplibregl.Marker[] = [];

    notes.forEach((note) => {
      const marker = new maplibregl.Marker()
        .setLngLat([note.lng, note.lat])
        .setPopup(
          new maplibregl.Popup().setHTML(
            `<b>${note.title}</b><br/>${note.content}`,
          ),
        )
        .addTo(map);

      markers.push(marker);
    });

    return () => markers.forEach((m) => m.remove());
  }, [notes]);

  return (
    <>
  <div ref={mapContainer} style={{ height: "100%" }} />
  
 {popupData && (
    <NoteFormPopup
      lat={popupData.lat}
      lng={popupData.lng}
      onSave={(data) => {
        onAddNote(data); // 交给父组件
        setPopupData(null); // 关闭弹窗
      }}
      onCancel={() => setPopupData(null)}
    />
  )}
  </>
)
  
};

export default MapView;
