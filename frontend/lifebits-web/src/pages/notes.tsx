import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createNoteInPlaceApi,
  createPlaceWithNoteApi,
  getPlacesMapApi,
} from "../api/placesApi";
import MapView from "../components/MapView";
import NoteFormPopup, {
  type NoteFormValues,
} from "../components/NoteFormPopup";
import PlaceList from "../components/PlaceList";
//import PlaceNotesPopup from "../components/PlaceNotesPopup";
import type { PlaceFeatureCollection } from "../types/geojson";

type CreateTarget =
  | {
      type: "new-place";
      lng: number;
      lat: number;
    }
  | {
      type: "existing-place";
      placeId: number;
    };

const emptyPlaces: PlaceFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

const Notes = () => {
  const [placesGeoJson, setPlacesGeoJson] =
    useState<PlaceFeatureCollection>(emptyPlaces);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial data load: the effect starts the API sync when this page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlaces();
  }, [fetchPlaces]);

  const handleSelectPlaceId = useCallback((placeId: number | null) => {
    setSelectedPlaceId(placeId);
  }, []);

  const handleCreateAtLocation = useCallback((lng: number, lat: number) => {
    setCreateTarget({
      type: "new-place",
      lng,
      lat,
    });
  }, []);

  const handleAddNoteToSelectedPlace = () => {
    if (!selectedPlace) return;

    setCreateTarget({
      type: "existing-place",
      placeId: selectedPlace.properties.placeId,
    });
  };

  const handleSaveNote = async (values: NoteFormValues) => {
    if (!createTarget) return;

    if (createTarget.type === "new-place") {
      await createPlaceWithNoteApi({
        name: values.placeName,
        title: values.title,
        content: values.content,
        eventTime: values.eventTime,
        location: {
          type: "Point",
          coordinates: [createTarget.lng, createTarget.lat],
        },
      });
    } else {
      await createNoteInPlaceApi(createTarget.placeId, {
        title: values.title,
        content: values.content,
        eventTime: values.eventTime,
      });
    }

    setCreateTarget(null);
    await fetchPlaces();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f9fafb" }}>
      <aside
        style={{
          width: "32%",
          minWidth: "320px",
          maxWidth: "420px",
          overflowY: "auto",
          borderRight: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
            background: "#ffffff",
          }}
        >
          <div>
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
            <div style={{ marginTop: "4px", fontSize: "13px", color: "#6b7280" }}>
              {isLoading
                ? "Loading..."
                : `${placesGeoJson.features.length} places`}
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        <PlaceList
          places={sortedPlaces}
          selectedPlaceId={selectedPlaceId ?? undefined}
          onSelectPlace={handleSelectPlaceId}
        />
      </aside>

      <main style={{ flex: 1 }}>
        <MapView
          placesGeoJson={placesGeoJson}
          selectedPlace={selectedPlace}
          onSelectPlaceId={handleSelectPlaceId}
          onCreateAtLocation={handleCreateAtLocation}
          onAddNoteToSelectedPlace={handleAddNoteToSelectedPlace}
        />
      </main>

      {/* {selectedPlace && (
        <PlaceNotesPopup
          place={selectedPlace}
          onAddNote={handleAddNoteToSelectedPlace}
          onClose={() => setSelectedPlaceId(null)}
        />
      )} */}

      {createTarget && (
        <NoteFormPopup
          mode={
            createTarget.type === "new-place" ? "new-place" : "existing-place"
          }
          onSave={handleSaveNote}
          onCancel={() => setCreateTarget(null)}
        />
      )}
    </div>
  );
};

export default Notes;
