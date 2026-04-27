import { useEffect, useRef} from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Note } from "../api/notesApi";
import NoteFormPopup from "./NoteFormPopup";
import { createRoot } from "react-dom/client";

interface MapViewProps {
  notes: Note[];
  onAddNote: (data: {
    title: string;
    content: string;
    lat: number;
    lng: number;
    eventTime: string;
  }) => void;
  selectedNote: Note | null;
}

const MapView = ({ notes, onAddNote, selectedNote }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: number]: maplibregl.Marker }>({});
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const showPopup = (lng: number, lat: number, note?: Note) => {
    if (!mapRef.current) return;

    // 如果已有 popup，先移除
    if (popupRef.current) {
      popupRef.current.remove();
    }

    const container = document.createElement("div");

    popupRef.current = new maplibregl.Popup({ offset: 25 })
      .setLngLat([lng, lat])
      .setDOMContent(container)
      .addTo(mapRef.current);

    // ⭐ 用 React 渲染到这个 container

    const root = createRoot(container);

    root.render(
      <NoteFormPopup
        lat={lat}
        lng={lng}
        initialData={
          note
            ? {
                id: note.id,
                title: note.title,
                content: note.content,
                eventTime: note.eventTime,
              }
            : undefined
        }
        onSave={(data) => {
          onAddNote(data);
          popupRef.current?.remove();
        }}
        onCancel={() => popupRef.current?.remove()}
      />,
    );
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [174.7762, -41.2865],
      zoom: 12,
    });

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      showPopup(lng, lat);
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
        .addTo(map);

      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation(); //Prevent the event from continuing to propagate to the map.
        showPopup(note.lng, note.lat, note);
      });

      markersRef.current[note.id] = marker;
      markers.push(marker);
    });

    return () => markers.forEach((m) => m.remove());
  }, [notes]);

  useEffect(() => {
    if (!mapRef.current || !selectedNote) return;

    mapRef.current.flyTo({
      center: [selectedNote.lng, selectedNote.lat],
      zoom: 14,
      duration: 1000, // 动画更丝滑
    });
    const marker = markersRef.current[selectedNote.id];
    if (marker) {
      showPopup(selectedNote.lng,selectedNote.lat, selectedNote);
    }
  }, [selectedNote]);

  return <div ref={mapContainer} style={{ height: "100%" }} />;
};

export default MapView;
