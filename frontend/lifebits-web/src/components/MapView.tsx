import { useEffect, useRef } from "react";
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
  onSelectNote?: (note: Note | null) => void;
  onDeleteNote: (id: number) => void;
}

const MapView = ({
  notes,
  onAddNote,
  selectedNote,
  onSelectNote,
  onDeleteNote,
}: MapViewProps) => {
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

    popupRef.current = new maplibregl.Popup({
      className: "lifebits-popup",
      offset: 20,
      closeButton: false,
      closeOnClick: false,
    })
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
        onCancel={() => {
          popupRef.current?.remove();
          onSelectNote?.(null);
        }}
        onDelete={(id) => {
          if (confirm("Delete this note?")) {
            onDeleteNote(id);
            popupRef.current?.remove();
          }
        }}
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
      onSelectNote?.(null);
      const { lng, lat } = e.lngLat;
      showPopup(lng, lat);
    });
    mapRef.current = map;

    return () => map.remove();
  }, []);

  const createMarkerEl = (isActive: boolean) => {
    const el = document.createElement("div");
    el.className = "lifebits-marker";
    if (isActive) el.classList.add("active");
    return el;
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const markers: maplibregl.Marker[] = [];

    notes.forEach((note) => {
      const el = createMarkerEl(selectedNote?.id == note.id);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([note.lng, note.lat])
        .addTo(map);

      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation(); //Prevent the event from continuing to propagate to the map.
        onSelectNote?.(note);
        //showPopup(note.lng, note.lat, note);
      });

      markersRef.current[note.id] = marker;
      markers.push(marker);
    });

    return () => markers.forEach((m) => m.remove());
  }, [notes]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // ⭐ 1. marker 状态统一更新（无论是否选中）
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();

      if (selectedNote && Number(id) === selectedNote.id) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });

    // ⭐ 2. 没选中 → 关闭 popup
    if (!selectedNote) {
      popupRef.current?.remove();
      return;
    }

    // ⭐ 3. flyTo
    map.flyTo({
      center: [selectedNote.lng, selectedNote.lat],
      zoom: 14,
      duration: 800,
    });

    // ⭐ 4. 打开 popup
    const marker = markersRef.current[selectedNote.id];
    if (marker) {
      showPopup(selectedNote.lng, selectedNote.lat, selectedNote);
    }
  }, [selectedNote]);

  useEffect(() => {
    if (!selectedNote) return;

    const exists = notes.some((n) => n.id === selectedNote.id);

    if (!exists) {
      popupRef.current?.remove();
      return;
    }
  }, [notes, selectedNote]);

  return <div ref={mapContainer} style={{ height: "100%" }} />;
};

export default MapView;
