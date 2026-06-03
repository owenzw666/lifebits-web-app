import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createNoteInPlaceApi,
  createPlaceWithNoteApi,
  deleteNoteInPlaceApi,
  deletePlaceApi,
  getPlacesMapApi,
  updateNoteInPlaceApi,
} from "../api/placesApi";
import MapView from "../components/MapView";
import NoteFormPopup, {
  type NoteFormValues,
} from "../components/NoteFormPopup";
import PlaceList from "../components/PlaceList";
import PlaceNotesPopup from "../components/PlaceNotesPopup";
import { AuthContext } from "../context/AuthContext";
import type { NoteSummary, PlaceFeatureCollection } from "../types/geojson";

type FormTarget =
  | {
      type: "new-place";
      lng: number;
      lat: number;
    }
  | {
      type: "existing-place";
      placeId: number;
    }
  | {
      type: "edit-note";
      placeId: number;
      note: NoteSummary;
    };

const emptyPlaces: PlaceFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
};

const Notes = () => {
  const auth = useContext(AuthContext);
  const isMobile = useIsMobile();
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isSidebarVisible, setIsSidebarVisible] = useState(!isMobile);
  const [isResizing, setIsResizing] = useState(false);
  const [placesGeoJson, setPlacesGeoJson] =
    useState<PlaceFeatureCollection>(emptyPlaces);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;

      setSidebarWidth(Math.min(Math.max(event.clientX, 300), 520));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const selectedPlace = useMemo(() => {
    return (
      placesGeoJson.features.find(
        (place) => place.properties.placeId === selectedPlaceId,
      ) ?? null
    );
  }, [placesGeoJson.features, selectedPlaceId]);

  const sortedPlaces = useMemo(() => {
    return [...placesGeoJson.features].sort((a, b) => {
      const aTime = a.properties.latestEventTime
        ? new Date(a.properties.latestEventTime).getTime()
        : 0;
      const bTime = b.properties.latestEventTime
        ? new Date(b.properties.latestEventTime).getTime()
        : 0;

      return bTime - aTime;
    });
  }, [placesGeoJson.features]);

  const fetchPlaces = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getPlacesMapApi();
      setPlacesGeoJson(data);
      return data;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial data load for the map and place list.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlaces();
  }, [fetchPlaces]);

  const handleSelectPlaceId = useCallback(
    (placeId: number | null) => {
      setSelectedPlaceId(placeId);

      if (isMobile && placeId !== null) {
        setIsSidebarVisible(false);
      }
    },
    [isMobile],
  );

  const handleCreateAtLocation = useCallback((lng: number, lat: number) => {
    // A map blank-click starts a brand new place, so clear the old selection first.
    setSelectedPlaceId(null);

    setFormTarget({
      type: "new-place",
      lng,
      lat,
    });
  }, []);

  const handleAddNoteToSelectedPlace = useCallback(() => {
    if (!selectedPlace) return;

    setFormTarget({
      type: "existing-place",
      placeId: selectedPlace.properties.placeId,
    });
  }, [selectedPlace]);

  const handleEditNote = useCallback(
    (note: NoteSummary) => {
      if (!selectedPlace) return;

      setFormTarget({
        type: "edit-note",
        placeId: selectedPlace.properties.placeId,
        note,
      });
    },
    [selectedPlace],
  );

  const handleSaveNote = async (values: NoteFormValues) => {
    if (!formTarget) return;

    if (formTarget.type === "new-place") {
      const createdPlace = await createPlaceWithNoteApi({
        name: values.placeName,
        title: values.title,
        content: values.content,
        eventTime: values.eventTime,
        location: {
          type: "Point",
          coordinates: [formTarget.lng, formTarget.lat],
        },
      });

      setFormTarget(null);
      await fetchPlaces();
      setSelectedPlaceId(createdPlace.placeId);

      return;
    } else if (formTarget.type === "existing-place") {
      await createNoteInPlaceApi(formTarget.placeId, {
        title: values.title,
        content: values.content,
        eventTime: values.eventTime,
      });
    } else {
      await updateNoteInPlaceApi(formTarget.placeId, formTarget.note.id, {
        title: values.title,
        content: values.content,
        eventTime: values.eventTime,
      });
    }

    setFormTarget(null);
    await fetchPlaces();
  };

  const handleDeleteNote = useCallback(
    async (note: NoteSummary) => {
      if (!selectedPlace) return;

      const isLastNote = selectedPlace.properties.noteCount <= 1;
      const confirmed = window.confirm(
        isLastNote
          ? "Delete this note? This is the last note here, so the place will also be deleted."
          : "Delete this note?",
      );

      if (!confirmed) return;

      await deleteNoteInPlaceApi(selectedPlace.properties.placeId, note.id);

      if (isLastNote) {
        setSelectedPlaceId(null);
      }

      await fetchPlaces();
    },
    [fetchPlaces, selectedPlace],
  );

  const handleDeletePlace = useCallback(async () => {
    if (!selectedPlace) return;

    const placeName =
      selectedPlace.properties.name ||
      `Place #${selectedPlace.properties.placeId}`;
    const confirmed = window.confirm(
      `Delete "${placeName}" and all notes inside it?`,
    );

    if (!confirmed) return;

    await deletePlaceApi(selectedPlace.properties.placeId);
    setSelectedPlaceId(null);
    await fetchPlaces();
  }, [fetchPlaces, selectedPlace]);

  const handleLogout = () => {
    auth.logout();
    window.location.href = "/login";
  };

  const placeCountLabel = isLoading
    ? "Loading..."
    : `${placesGeoJson.features.length} places`;

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        minHeight: 0,
        background: "#f9fafb",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {!isMobile && isSidebarVisible && (
        <aside
          style={{
            width: sidebarWidth,
            minWidth: 300,
            maxWidth: 520,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #e5e7eb",
            background: "#ffffff",
            overflow: "hidden",
          }}
        >
          <SidebarHeader
            subtitle={selectedPlace ? "Place details" : placeCountLabel}
            onCollapse={() => setIsSidebarVisible(false)}
            onLogout={handleLogout}
          />

          {selectedPlace ? (
            <PlaceNotesPopup
              place={selectedPlace}
              variant="sidebar"
              onAddNote={handleAddNoteToSelectedPlace}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              onDeletePlace={handleDeletePlace}
              onClose={() => setSelectedPlaceId(null)}
            />
          ) : (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <PlaceList
                places={sortedPlaces}
                selectedPlaceId={selectedPlaceId ?? undefined}
                onSelectPlace={handleSelectPlaceId}
              />
            </div>
          )}
        </aside>
      )}

      {!isMobile && isSidebarVisible && (
        <div
          onMouseDown={(event) => {
            event.preventDefault();
            setIsResizing(true);
          }}
          style={{
            width: 6,
            cursor: "col-resize",
            background: isResizing ? "#dbeafe" : "transparent",
            zIndex: 5,
          }}
        />
      )}

      <main style={{ flex: 1, minWidth: 0, height: "100%" }}>
        <MapView
          placesGeoJson={placesGeoJson}
          selectedPlace={selectedPlace}
          onSelectPlaceId={handleSelectPlaceId}
          onCreateAtLocation={handleCreateAtLocation}
        />
      </main>

      {!isMobile && !isSidebarVisible && (
        <button
          onClick={() => setIsSidebarVisible(true)}
          style={floatingButtonStyle}
        >
          Places
        </button>
      )}

      {isMobile && (
        <>
          <button
            onClick={() => setIsSidebarVisible((visible) => !visible)}
            style={{
              ...mobileToggleStyle,
              bottom: "calc(18px + env(safe-area-inset-bottom))",
            }}
          >
            {isSidebarVisible ? "Show map" : "Places"}
          </button>

          {isSidebarVisible && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 20,
                display: "flex",
                alignItems: "flex-end",
                background: "rgba(15, 23, 42, 0.24)",
              }}
              onClick={() => setIsSidebarVisible(false)}
            >
              <section
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "100%",
                  height: "min(72dvh, 640px)",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "18px 18px 0 0",
                  background: "#ffffff",
                  boxShadow: "0 -18px 40px rgba(15, 23, 42, 0.22)",
                  overflow: "hidden",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 44,
                    height: 5,
                    borderRadius: 999,
                    background: "#d1d5db",
                    margin: "10px auto 2px",
                  }}
                />
                <SidebarHeader
                  subtitle={placeCountLabel}
                  onCollapse={() => setIsSidebarVisible(false)}
                  onLogout={handleLogout}
                />
                <div style={{ flex: 1, overflowY: "auto" }}>
                  <PlaceList
                    places={sortedPlaces}
                    selectedPlaceId={selectedPlaceId ?? undefined}
                    onSelectPlace={handleSelectPlaceId}
                  />
                </div>
              </section>
            </div>
          )}

          {selectedPlace && (
            <PlaceNotesPopup
              place={selectedPlace}
              variant="sheet"
              onAddNote={handleAddNoteToSelectedPlace}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              onDeletePlace={handleDeletePlace}
              onClose={() => setSelectedPlaceId(null)}
            />
          )}
        </>
      )}

      {formTarget && (
        <NoteFormPopup
          mode={
            formTarget.type === "new-place"
              ? "new-place"
              : formTarget.type === "edit-note"
                ? "edit-note"
                : "existing-place"
          }
          initialValues={
            formTarget.type === "edit-note"
              ? {
                  title: formTarget.note.title,
                  content: formTarget.note.content,
                  eventTime: formTarget.note.eventTime,
                }
              : undefined
          }
          isMobile={isMobile}
          onSave={handleSaveNote}
          onCancel={() => setFormTarget(null)}
        />
      )}
    </div>
  );
};

const SidebarHeader = ({
  subtitle,
  onCollapse,
  onLogout,
}: {
  subtitle: string;
  onCollapse: () => void;
  onLogout: () => void;
}) => {
  return (
    <header
      style={{
        flex: "0 0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        padding: "14px 16px",
        borderBottom: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: "22px",
            lineHeight: 1.2,
            color: "#111827",
          }}
        >
          Places
        </h1>
        <div
          style={{
            marginTop: "4px",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          {subtitle}
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", flex: "0 0 auto" }}>
        <button onClick={onCollapse} style={headerButtonStyle}>
          Hide
        </button>
        <button onClick={onLogout} style={headerButtonStyle}>
          Logout
        </button>
      </div>
    </header>
  );
};

const headerButtonStyle = {
  minHeight: 40,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
} as const;

const floatingButtonStyle = {
  position: "absolute",
  left: 16,
  top: 16,
  zIndex: 10,
  minHeight: 42,
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.16)",
  cursor: "pointer",
  fontWeight: 650,
} as const;

const mobileToggleStyle = {
  position: "absolute",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 19,
  minHeight: 48,
  minWidth: 132,
  padding: "12px 20px",
  borderRadius: 999,
  border: "none",
  background: "#111827",
  color: "#ffffff",
  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.32)",
  cursor: "pointer",
  fontWeight: 700,
} as const;

export default Notes;
