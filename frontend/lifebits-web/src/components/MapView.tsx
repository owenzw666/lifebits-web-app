import { useEffect,  useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Note } from "../api/notesApi";
import NoteFormPopup from "./NoteFormPopup";
import { createRoot } from "react-dom/client";
import { type NoteGroup } from "../utils/group";
import NoteGroupPopup from "./NoteGroupPopup";

interface MapViewProps {
  noteGroups: NoteGroup[];
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
  onViewMoreGroup?: (groupId: string) => void;
}

const MapView = ({
  noteGroups,
  onAddNote,
  selectedNote,
  onSelectNote,
  onDeleteNote,
  onViewMoreGroup,
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{
    [key: string]: {
      marker: maplibregl.Marker;
      group: NoteGroup;
    };
  }>({});
  console.log("noteGroups:", noteGroups);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  type PopupState =
    | { type: "group"; group: NoteGroup }
    | { type: "note"; note: Note }
    | { type: "create"; lat: number; lng: number }
    | null;

  //控制弹窗
  const [popupState, setPopupState] = useState<PopupState>(null);

  //渲染弹窗组件
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
          onViewMore={()=>{
            onViewMoreGroup?.(group.key);//Pass group on to the Notes page
            //console.log("view more",group);
          }}
        />,
      );
    }
  }, [popupState]);

  //初始化地图，地图点击创建记事
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

 //创建Marker方法
 const createMarkerEl = (
  noteCount: number,
  isActive: boolean
) => {

  // 最外层
  const wrapper = document.createElement("div");
  wrapper.className = "marker-wrapper";

  // 数量 badge
  if (noteCount > 1) {
    const countEl = document.createElement("div");
    countEl.className = "marker-count";
    countEl.innerText = String(noteCount);

    wrapper.appendChild(countEl);
  }

  // marker 本体
  const markerEl = document.createElement("div");
  markerEl.className = "lifebits-marker";

  if (isActive) {
    markerEl.classList.add("active");
  }

  wrapper.appendChild(markerEl);

  return wrapper;
};

  //Group the notes by location
  //const groups = useMemo(() => groupByLocation(notes), [notes]);

  useEffect(() => {
    if (!mapRef.current || noteGroups.length === 0) return;

    const map = mapRef.current;
    const markers: maplibregl.Marker[] = [];

    noteGroups.forEach((g) => {
      const el = createMarkerEl(
        g.notes.length,
        selectedNote ? g.notes.some((n) => n.id === selectedNote.id) : false,
      );
 
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
        group: g, 
      };

      markers.push(marker);
    });

    return () => markers.forEach((m) => m.remove());
  }, [noteGroups]);

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

    const exists = noteGroups.find((m)=>m.notes.some((n) => n.id === selectedNote.id));

    if (!exists) {
      popupRef.current?.remove();
      return;
    }
  }, [noteGroups, selectedNote]);

  return <div ref={mapContainer} style={{ height: "100%" }} />;
};

export default MapView;
