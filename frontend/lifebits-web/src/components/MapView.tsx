import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Note } from "../api/notesApi";
import NoteFormPopup from "./NoteFormPopup";
import { createRoot } from "react-dom/client";
import { groupByLocation, type NoteGroup } from "../utils/group";
import NoteGroupPopup from "./NoteGroupPopup";

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
  const markersRef = useRef<{
    [key: string]: {
      marker: maplibregl.Marker;
      group: NoteGroup;
    };
  }>({});
  const popupRef = useRef<maplibregl.Popup | null>(null);

  type PopupState =
    | { type: "group"; group: NoteGroup }
    | { type: "note"; note: Note }
    | { type: "create"; lat: number; lng: number }
    | null;

  //  控制弹窗
  const [popupState, setPopupState] = useState<PopupState>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 清掉旧 popup
    popupRef.current?.remove();

    if (!popupState) return;

    const container = document.createElement("div");

    popupRef.current = new maplibregl.Popup({
      className: "lifebits-popup",
      offset: 20,
      closeButton: false,
      closeOnClick: false,
    })
      .setDOMContent(container)
      .addTo(mapRef.current);

    const root = createRoot(container);

    // ⭐ 根据状态机分支
    if (popupState.type === "create") {
      popupRef.current.setLngLat([popupState.lng, popupState.lat]);

      root.render(
        <NoteFormPopup
          lat={popupState.lat}
          lng={popupState.lng}
          onSave={(data) => {
            onAddNote(data);
            setPopupState(null);
          }}
          onCancel={() => setPopupState(null)}
        />,
      );
    }

    if (popupState.type === "note") {
      const note = popupState.note;

      popupRef.current.setLngLat([note.lng, note.lat]);

      root.render(
        <NoteFormPopup
          lat={note.lat}
          lng={note.lng}
          initialData={note}
          onSave={(data) => {
            onSelectNote?.(null);
            onAddNote(data);
            setPopupState(null);
          }}
          onCancel={() => {
            onSelectNote?.(null);
            setPopupState(null);
          }}
          onDelete={(id) => {
            onSelectNote?.(null);
            onDeleteNote(id);
            setPopupState(null);
          }}
        />,
      );
    }

    if (popupState.type === "group") {
      const group = popupState.group;

      popupRef.current.setLngLat([group.lng, group.lat]);

      root.render(
        <NoteGroupPopup
          group={group}
          onSelectNote={(id) => {
            const note = group.notes.find((n) => n.id === id);
            if (note) {
              //setPopupState({ type: "note", note }); // 切换状态
              onSelectNote?.(note);
            }
          }}
          onAdd={() => {
            setPopupState({
              type: "create",
              lat: group.lat,
              lng: group.lng,
            });
          }}
        />,
      );
    }
  }, [popupState]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [174.7762, -41.2865],
      zoom: 12,
    });

    map.on("click", (e) => {
      popupRef.current?.remove();
      const { lng, lat } = e.lngLat;
      //设置弹窗为创建记事
      setPopupState({
        type: "create",
        lng,
        lat,
      });
      onSelectNote?.(null);
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

  const groups = useMemo(() => groupByLocation(notes), [notes]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const markers: maplibregl.Marker[] = [];

    groups.forEach((g) => {
      const el = createMarkerEl(
        selectedNote ? g.notes.some((n) => n.id === selectedNote.id) : false,
      );
      if (g.notes.length > 1) {
        el.innerText = String(g.notes.length);
      }
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([g.lng, g.lat])
        .addTo(map);

      marker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();
        //设置弹窗为group
        setPopupState({
          type: "group",
          group: g,
        });

        onSelectNote?.(null);
      });

      markersRef.current[g.key] = {
        marker,
        group: g, // ⭐ 修复点
      };

      markers.push(marker);
    });

    return () => markers.forEach((m) => m.remove());
  }, [notes]);

  useEffect(() => {
    if (!mapRef.current) return;

    Object.values(markersRef.current).forEach(({ marker, group }) => {
      const el = marker.getElement();

      const isActive =
        selectedNote && group.notes.some((n) => n.id === selectedNote.id);

      el.classList.toggle("active", !!isActive);
    });

    if (!selectedNote) return;

    mapRef.current.flyTo({
      center: [selectedNote.lng, selectedNote.lat],
      zoom: 14,
      duration: 800,
    });

    setPopupState({
      type: "note",
      note: selectedNote,
    });
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
