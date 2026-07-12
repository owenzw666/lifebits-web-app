import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createNoteInPlaceApi,
  createPlaceWithNoteApi,
  deleteNotePhotoApi,
  deleteNoteInPlaceApi,
  deletePlaceApi,
  getPlacesMapApi,
  getTimelineApi,
  reverseGeocodePlaceApi,
  type MapCenter,
  type PlaceSearchResult,
  type TimelineItem,
  uploadNotePhotoApi,
  updatePlaceApi,
  updateNoteInPlaceApi,
} from "../api/placesApi";
import { getApiErrorMessage } from "../api/http";
import MapView from "../components/MapView";
import ConfirmDialog from "../components/ConfirmDialog";
import NoteFormPopup, {
  type NoteFormValues,
} from "../components/NoteFormPopup";
import PlaceList from "../components/PlaceList";
import PlaceNotesPopup from "../components/PlaceNotesPopup";
import PlaceSearch from "../components/PlaceSearch";
import TimelineList from "../components/TimelineList";
import Toast, { type ToastType } from "../components/Toast";
import type {
  NotePhoto,
  NoteSummary,
  PlaceFeatureCollection,
} from "../types/geojson";
import { defaultNoteCategory } from "../utils/noteCategories";

type FormTarget =
  | {
      type: "new-place";
      lng: number;
      lat: number;
      suggestedPlaceName?: string;
      isResolvingPlaceName: boolean;
    }
  | {
      type: "existing-place";
      placeId: number;
    };

interface ToastState {
  message: string;
  type: ToastType;
}

interface DeleteConfirmationState {
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
}

type SidebarView = "places" | "timeline";

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
  const isMobile = useIsMobile();
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isSidebarVisible, setIsSidebarVisible] = useState(!isMobile);
  const [isResizing, setIsResizing] = useState(false);
  const [placesGeoJson, setPlacesGeoJson] =
    useState<PlaceFeatureCollection>(emptyPlaces);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [selectedTimelineNoteId, setSelectedTimelineNoteId] = useState<
    number | null
  >(null);
  const [sidebarView, setSidebarView] = useState<SidebarView>("places");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineTotalCount, setTimelineTotalCount] = useState(0);
  const [timelineHasMore, setTimelineHasMore] = useState(false);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);
  const [isTimelineLoadingMore, setIsTimelineLoadingMore] = useState(false);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [searchResult, setSearchResult] = useState<PlaceSearchResult | null>(
    null,
  );
  const [mapCenter, setMapCenter] = useState<MapCenter>({
    longitude: 174.7762,
    latitude: -41.2865,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSavingLabel, setNoteSavingLabel] = useState("Saving note...");
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPlace, setIsDeletingPlace] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmationState | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timerId = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => window.clearTimeout(timerId);
  }, [toast]);

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
    // Store only the selected id. The full selected place is derived from fresh map data.
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

  const fetchTimelineFirstPage = useCallback(async () => {
    setIsTimelineLoading(true);

    try {
      const data = await getTimelineApi(1);
      setTimelineItems(data.items);
      setTimelinePage(data.page);
      setTimelineTotalCount(data.totalCount);
      setTimelineHasMore(data.hasMore);
      return data;
    } catch (error) {
      console.error(error);
      return null;
    } finally {
      setIsTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load both navigation views so switching tabs feels immediate.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlaces();
    fetchTimelineFirstPage();
  }, [fetchPlaces, fetchTimelineFirstPage]);

  const handleSelectPlaceId = useCallback(
    (placeId: number | null) => {
      setSelectedPlaceId(placeId);
      setSelectedTimelineNoteId(null);

      if (placeId !== null) {
        setSearchResult(null);
      }

      if (isMobile && placeId !== null) {
        setIsSidebarVisible(false);
      }
    },
    [isMobile],
  );

  const handleSelectTimelineItem = useCallback(
    (item: TimelineItem) => {
      setSearchResult(null);
      setSelectedTimelineNoteId(item.noteId);
      setSelectedPlaceId(item.placeId);

      if (isMobile) {
        setIsSidebarVisible(false);
      }
    },
    [isMobile],
  );

  const handleLoadMoreTimeline = useCallback(async () => {
    if (!timelineHasMore || isTimelineLoadingMore) return;

    setIsTimelineLoadingMore(true);

    try {
      const data = await getTimelineApi(timelinePage + 1);
      setTimelineItems((current) => [...current, ...data.items]);
      setTimelinePage(data.page);
      setTimelineTotalCount(data.totalCount);
      setTimelineHasMore(data.hasMore);
    } catch (error) {
      console.error(error);
      showToast("Could not load more memories.", "error");
    } finally {
      setIsTimelineLoadingMore(false);
    }
  }, [
    isTimelineLoadingMore,
    showToast,
    timelineHasMore,
    timelinePage,
  ]);

  const handleCreateAtLocation = useCallback((lng: number, lat: number) => {
    // Open the form immediately, then fill the place name when reverse geocoding returns.
    setSelectedPlaceId(null);
    setSearchResult(null);
    setFormTarget({
      type: "new-place",
      lng,
      lat,
      isResolvingPlaceName: true,
    });

    reverseGeocodePlaceApi(lng, lat)
      .then((result) => {
        setFormTarget((current) => {
          if (
            !current ||
            current.type !== "new-place" ||
            current.lng !== lng ||
            current.lat !== lat
          ) {
            return current;
          }

          return {
            ...current,
            suggestedPlaceName: result.placeName ?? undefined,
            isResolvingPlaceName: false,
          };
        });
      })
      .catch((error) => {
        console.error(error);
        setFormTarget((current) => {
          if (
            !current ||
            current.type !== "new-place" ||
            current.lng !== lng ||
            current.lat !== lat
          ) {
            return current;
          }

          return {
            ...current,
            isResolvingPlaceName: false,
          };
        });
      });
  }, []);

  const handleSelectSearchResult = useCallback((result: PlaceSearchResult) => {
    setSelectedPlaceId(null);
    setFormTarget(null);
    setSearchResult(result);
  }, []);

  const handleAddNoteAtSearchResult = useCallback(
    (result: PlaceSearchResult) => {
      setSelectedPlaceId(null);
      setSearchResult(result);
      setFormTarget({
        type: "new-place",
        lng: result.longitude,
        lat: result.latitude,
        suggestedPlaceName: result.name,
        isResolvingPlaceName: false,
      });
    },
    [],
  );

  const handleAddNoteToSelectedPlace = useCallback(() => {
    if (!selectedPlace) return;

    setFormTarget({
      type: "existing-place",
      placeId: selectedPlace.properties.placeId,
    });
  }, [selectedPlace]);

  const handleSaveNote = async (values: NoteFormValues) => {
    if (!formTarget) return;

    setIsSavingNote(true);
    setNoteSavingLabel("Saving note...");

    try {
      let createdPlaceId: number;
      let createdNoteId: number;

      if (formTarget.type === "new-place") {
        const created = await createPlaceWithNoteApi({
          name: values.placeName,
          title: values.title,
          content: values.content,
          category: values.category,
          eventTime: values.eventTime,
          location: {
            type: "Point",
            coordinates: [formTarget.lng, formTarget.lat],
          },
        });

        createdPlaceId = created.placeId;
        createdNoteId = created.noteId;
      } else {
        const created = await createNoteInPlaceApi(formTarget.placeId, {
          title: values.title,
          content: values.content,
          category: values.category,
          eventTime: values.eventTime,
        });

        createdPlaceId = created.placeId;
        createdNoteId = created.noteId;
      }

      // The note must exist before its photos can be linked by NoteId.
      // Upload every selected photo, while keeping the saved note if one upload fails.
      const selectedPhotos = values.photos ?? [];
      if (selectedPhotos.length > 0) {
        setNoteSavingLabel(
          `Uploading ${selectedPhotos.length} photo${selectedPhotos.length === 1 ? "" : "s"}...`,
        );
      }
      let failedPhotoCount = 0;

      // Upload photos one by one. Sequential uploads are slightly slower, but
      // they are much more reliable on mobile networks than several concurrent
      // multipart requests.
      for (const file of selectedPhotos) {
        try {
          await uploadNotePhotoApi(createdPlaceId, createdNoteId, file);
        } catch (error) {
          failedPhotoCount += 1;
          console.warn("Photo upload failed", error);
        }
      }

      setFormTarget(null);
      await Promise.all([fetchPlaces(), fetchTimelineFirstPage()]);
      setSelectedPlaceId(createdPlaceId);
      setSelectedTimelineNoteId(createdNoteId);

      if (failedPhotoCount > 0) {
        showToast(
          `Note saved, but ${failedPhotoCount} photo${failedPhotoCount === 1 ? "" : "s"} could not be uploaded.`,
          "error",
        );
      } else {
        showToast(
          selectedPhotos.length > 0 ? "Note and photos saved" : "Note saved",
          "success",
        );
      }
    } catch (error) {
      console.error(error);
      showToast("Could not save note. Please try again.", "error");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleUpdateNote = useCallback(
    async (note: NoteSummary, values: NoteFormValues) => {
      if (!selectedPlace) return false;

      setIsSavingNote(true);

      try {
        await updateNoteInPlaceApi(
          selectedPlace.properties.placeId,
          note.id,
          {
            title: values.title,
            content: values.content,
            category: values.category,
            eventTime: values.eventTime,
          },
        );

        await Promise.all([fetchPlaces(), fetchTimelineFirstPage()]);
        showToast("Note updated", "success");
        return true;
      } catch (error) {
        console.error(error);
        showToast("Could not update note. Please try again.", "error");
        return false;
      } finally {
        setIsSavingNote(false);
      }
    },
    [fetchPlaces, fetchTimelineFirstPage, selectedPlace, showToast],
  );

  const handleUpdatePlace = useCallback(
    async (name: string) => {
      if (!selectedPlace) return false;

      setIsSavingNote(true);

      try {
        await updatePlaceApi(
          selectedPlace.properties.placeId,
          name.trim() || undefined,
        );
        await Promise.all([fetchPlaces(), fetchTimelineFirstPage()]);
        showToast("Place updated", "success");
        return true;
      } catch (error) {
        console.error(error);
        showToast("Could not update place. Please try again.", "error");
        return false;
      } finally {
        setIsSavingNote(false);
      }
    },
    [fetchPlaces, fetchTimelineFirstPage, selectedPlace, showToast],
  );

  const handleDeleteNote = useCallback(
    (note: NoteSummary) => {
      if (!selectedPlace) return;

      const isLastNote = selectedPlace.properties.noteCount <= 1;
      const placeId = selectedPlace.properties.placeId;

      setDeleteConfirmation({
        title: "Delete note?",
        message: isLastNote
          ? "This is the last note here, so deleting it will also delete the place. This action cannot be undone."
          : "This note will be permanently deleted. This action cannot be undone.",
        onConfirm: async () => {
          setDeletingNoteId(note.id);

          try {
            await deleteNoteInPlaceApi(placeId, note.id);

            if (isLastNote) {
              setSelectedPlaceId(null);
              setSelectedTimelineNoteId(null);
            }

            await Promise.all([fetchPlaces(), fetchTimelineFirstPage()]);
            showToast("Note deleted", "success");
          } catch (error) {
            console.error(error);
            showToast("Could not delete note. Please try again.", "error");
          } finally {
            setDeletingNoteId(null);
          }
        },
      });
    },
    [fetchPlaces, fetchTimelineFirstPage, selectedPlace, showToast],
  );

  const handleUploadPhoto = useCallback(
    async (note: NoteSummary, file: File) => {
      if (!selectedPlace || isUploadingPhoto) return;

      setIsUploadingPhoto(true);

      try {
        await uploadNotePhotoApi(
          selectedPlace.properties.placeId,
          note.id,
          file,
        );
        await Promise.all([fetchPlaces(), fetchTimelineFirstPage()]);
        showToast("Photo added", "success");
      } catch (error) {
        console.error(error);
        showToast(
          getApiErrorMessage(
            error,
            "Could not upload photo. Check its type and size.",
          ),
          "error",
        );
      } finally {
        setIsUploadingPhoto(false);
      }
    },
    [
      fetchPlaces,
      fetchTimelineFirstPage,
      isUploadingPhoto,
      selectedPlace,
      showToast,
    ],
  );

  const handleDeletePhoto = useCallback(
    (note: NoteSummary, photo: NotePhoto) => {
      if (!selectedPlace || deletingPhotoId !== null) return;

      const placeId = selectedPlace.properties.placeId;

      setDeleteConfirmation({
        title: "Delete photo?",
        message: "This photo will be permanently removed from the note.",
        onConfirm: async () => {
          setDeletingPhotoId(photo.id);

          try {
            await deleteNotePhotoApi(placeId, note.id, photo.id);
            await Promise.all([fetchPlaces(), fetchTimelineFirstPage()]);
            showToast("Photo deleted", "success");
          } catch (error) {
            console.error(error);
            showToast("Could not delete photo. Please try again.", "error");
          } finally {
            setDeletingPhotoId(null);
          }
        },
      });
    },
    [
      deletingPhotoId,
      fetchPlaces,
      fetchTimelineFirstPage,
      selectedPlace,
      showToast,
    ],
  );

  const handleDeletePlace = useCallback(() => {
    if (!selectedPlace) return;

    const placeName =
      selectedPlace.properties.name ||
      `Place #${selectedPlace.properties.placeId}`;
    const placeId = selectedPlace.properties.placeId;

    setDeleteConfirmation({
      title: "Delete place?",
      message: `"${placeName}" and all notes and photos inside it will be permanently deleted.`,
      onConfirm: async () => {
        setIsDeletingPlace(true);

        try {
          await deletePlaceApi(placeId);
          setSelectedPlaceId(null);
          setSelectedTimelineNoteId(null);
          await Promise.all([fetchPlaces(), fetchTimelineFirstPage()]);
          showToast("Place deleted", "success");
        } catch (error) {
          console.error(error);
          showToast("Could not delete place. Please try again.", "error");
        } finally {
          setIsDeletingPlace(false);
        }
      },
    });
  }, [fetchPlaces, fetchTimelineFirstPage, selectedPlace, showToast]);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmation || isConfirmingDelete) return;

    setIsConfirmingDelete(true);
    try {
      await deleteConfirmation.onConfirm();
    } finally {
      setIsConfirmingDelete(false);
      setDeleteConfirmation(null);
    }
  }, [deleteConfirmation, isConfirmingDelete]);

  const handleOpenAccount = () => {
    window.location.href = "/account";
  };

  const placeCountLabel = isLoading
    ? "Loading..."
    : `${placesGeoJson.features.length} places`;
  const timelineCountLabel = isTimelineLoading
    ? "Loading..."
    : `${timelineTotalCount} memories`;
  const sidebarSubtitle = selectedPlace
    ? "Place details"
    : sidebarView === "places"
      ? placeCountLabel
      : timelineCountLabel;

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
            title={
              selectedPlace
                ? "Places"
                : sidebarView === "places"
                  ? "Places"
                  : "Timeline"
            }
            subtitle={sidebarSubtitle}
            onCollapse={() => setIsSidebarVisible(false)}
            onAccount={handleOpenAccount}
          />

          {selectedPlace ? (
            <PlaceNotesPopup
              key={`${selectedPlace.properties.placeId}-${selectedTimelineNoteId ?? "list"}`}
              place={selectedPlace}
              variant="sidebar"
              initialSelectedNoteId={selectedTimelineNoteId}
              onAddNote={handleAddNoteToSelectedPlace}
              onUpdateNote={handleUpdateNote}
              onUpdatePlace={handleUpdatePlace}
              onDeleteNote={handleDeleteNote}
              onUploadPhoto={handleUploadPhoto}
              onDeletePhoto={handleDeletePhoto}
              onDeletePlace={handleDeletePlace}
              deletingNoteId={deletingNoteId}
              deletingPhotoId={deletingPhotoId}
              isUploadingPhoto={isUploadingPhoto}
              isDeletingPlace={isDeletingPlace}
              isSaving={isSavingNote}
              onClose={() => {
                setSelectedPlaceId(null);
                setSelectedTimelineNoteId(null);
              }}
            />
          ) : (
            <>
              <SidebarTabs value={sidebarView} onChange={setSidebarView} />
              <div style={{ flex: 1, overflowY: "auto" }}>
                {sidebarView === "places" ? (
                  <PlaceList
                    places={sortedPlaces}
                    selectedPlaceId={selectedPlaceId ?? undefined}
                    onSelectPlace={handleSelectPlaceId}
                  />
                ) : (
                  <TimelineList
                    items={timelineItems}
                    totalCount={timelineTotalCount}
                    isLoading={isTimelineLoading}
                    isLoadingMore={isTimelineLoadingMore}
                    hasMore={timelineHasMore}
                    onSelectItem={handleSelectTimelineItem}
                    onLoadMore={handleLoadMoreTimeline}
                  />
                )}
              </div>
            </>
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
          searchResult={searchResult}
          onMapCenterChange={setMapCenter}
          onSelectPlaceId={handleSelectPlaceId}
          onCreateAtLocation={handleCreateAtLocation}
        />
      </main>

      <PlaceSearch
        mapCenter={mapCenter}
        selectedResult={searchResult}
        onSelectResult={handleSelectSearchResult}
        onClearSelection={() => setSearchResult(null)}
        onAddNote={handleAddNoteAtSearchResult}
      />

      {!isMobile && !isSidebarVisible && (
        <button
          onClick={() => setIsSidebarVisible(true)}
          style={floatingButtonStyle}
        >
          {sidebarView === "places" ? "Places" : "Timeline"}
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
            {isSidebarVisible
              ? "Show map"
              : sidebarView === "places"
                ? "Places"
                : "Timeline"}
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
                  title={sidebarView === "places" ? "Places" : "Timeline"}
                  subtitle={
                    sidebarView === "places"
                      ? placeCountLabel
                      : timelineCountLabel
                  }
                  onCollapse={() => setIsSidebarVisible(false)}
                  onAccount={handleOpenAccount}
                />
                <SidebarTabs value={sidebarView} onChange={setSidebarView} />
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {sidebarView === "places" ? (
                    <PlaceList
                      places={sortedPlaces}
                      selectedPlaceId={selectedPlaceId ?? undefined}
                      onSelectPlace={handleSelectPlaceId}
                    />
                  ) : (
                    <TimelineList
                      items={timelineItems}
                      totalCount={timelineTotalCount}
                      isLoading={isTimelineLoading}
                      isLoadingMore={isTimelineLoadingMore}
                      hasMore={timelineHasMore}
                      onSelectItem={handleSelectTimelineItem}
                      onLoadMore={handleLoadMoreTimeline}
                    />
                  )}
                </div>
              </section>
            </div>
          )}

          {selectedPlace && (
            <PlaceNotesPopup
              key={`${selectedPlace.properties.placeId}-${selectedTimelineNoteId ?? "list"}`}
              place={selectedPlace}
              variant="sheet"
              initialSelectedNoteId={selectedTimelineNoteId}
              onAddNote={handleAddNoteToSelectedPlace}
              onUpdateNote={handleUpdateNote}
              onUpdatePlace={handleUpdatePlace}
              onDeleteNote={handleDeleteNote}
              onUploadPhoto={handleUploadPhoto}
              onDeletePhoto={handleDeletePhoto}
              onDeletePlace={handleDeletePlace}
              deletingNoteId={deletingNoteId}
              deletingPhotoId={deletingPhotoId}
              isUploadingPhoto={isUploadingPhoto}
              isDeletingPlace={isDeletingPlace}
              isSaving={isSavingNote}
              onClose={() => {
                setSelectedPlaceId(null);
                setSelectedTimelineNoteId(null);
              }}
            />
          )}
        </>
      )}

      {formTarget && (
        <NoteFormPopup
          mode={
            formTarget.type === "new-place"
              ? "new-place"
              : "existing-place"
          }
          initialValues={
            formTarget.type === "new-place"
              ? {
                  title: "",
                  content: "",
                  category: defaultNoteCategory,
                  eventTime: new Date().toISOString(),
                  placeName: formTarget.suggestedPlaceName,
                  photos: [],
                }
              : undefined
          }
          isResolvingPlaceName={
            formTarget.type === "new-place" && formTarget.isResolvingPlaceName
          }
          isMobile={isMobile}
          isSaving={isSavingNote}
          savingLabel={noteSavingLabel}
          onSave={handleSaveNote}
          onCancel={() => {
            if (!isSavingNote) setFormTarget(null);
          }}
        />
      )}

      {deleteConfirmation && (
        <ConfirmDialog
          title={deleteConfirmation.title}
          message={deleteConfirmation.message}
          isConfirming={isConfirmingDelete}
          onCancel={() => {
            if (!isConfirmingDelete) setDeleteConfirmation(null);
          }}
          onConfirm={confirmDelete}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} isMobile={isMobile} />
      )}
    </div>
  );
};

const SidebarHeader = ({
  title,
  subtitle,
  onCollapse,
  onAccount,
}: {
  title: string;
  subtitle: string;
  onCollapse: () => void;
  onAccount: () => void;
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
          {title}
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
        <button onClick={onAccount} style={headerButtonStyle}>
          Account
        </button>
      </div>
    </header>
  );
};

const SidebarTabs = ({
  value,
  onChange,
}: {
  value: SidebarView;
  onChange: (value: SidebarView) => void;
}) => {
  return (
    <div
      role="tablist"
      aria-label="Memory views"
      style={{
        flex: "0 0 auto",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "4px",
        padding: "8px 12px",
        borderBottom: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      {(["places", "timeline"] as const).map((view) => {
        const isActive = value === view;
        const label = view === "places" ? "Places" : "Timeline";

        return (
          <button
            key={view}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(view)}
            style={{
              minHeight: 38,
              padding: "8px 10px",
              border: "none",
              borderRadius: "6px",
              background: isActive ? "#111827" : "#f3f4f6",
              color: isActive ? "#ffffff" : "#4b5563",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
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
