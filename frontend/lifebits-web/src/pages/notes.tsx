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
import Toast, { type ToastType } from "../components/Toast";
import { AuthContext } from "../context/AuthContext";
import type { NoteSummary, PlaceFeatureCollection } from "../types/geojson";

type FormTarget =
  // 点击地图空白处时，表单需要知道新地点的经纬度。
  | {
      type: "new-place";
      lng: number;
      lat: number;
    }
  // 在已有地点里新增记事时，只需要知道这个地点的 id。
  | {
      type: "existing-place";
      placeId: number;
    }
  // 编辑记事时，需要地点 id 和原来的 note 数据，用来填充表单。
  | {
      type: "edit-note";
      placeId: number;
      note: NoteSummary;
    };

const emptyPlaces: PlaceFeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

interface ToastState {
  message: string;
  type: ToastType;
}

const useIsMobile = () => {
  // 用一个简单的窗口宽度判断移动端布局，后面窗口变化时也会同步更新。
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
  // selectedPlaceId 是页面的核心选中状态，地图高亮和详情面板都依赖它。
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  // formTarget 决定当前表单是在创建新地点、新增记事，还是编辑记事。
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // 下面三个状态用于锁住正在请求的按钮，防止用户连续点击造成重复请求。
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [isDeletingPlace, setIsDeletingPlace] = useState(false);
  // toast 是临时提示信息，成功和失败都通过它展示给用户。
  const [toast, setToast] = useState<ToastState | null>(null);

  // 把显示提示封装成一个函数，其他操作只需要传 message 和 type。
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;

    // 每条提示自动停留一小段时间，然后自己消失。
    const timerId = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => window.clearTimeout(timerId);
  }, [toast]);

  useEffect(() => {
    // 侧边栏拖拽宽度时，需要监听整个窗口的 mousemove。
    // 这样鼠标移出侧边栏后，拖拽仍然可以继续。
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
    // 这里只保存 selectedPlaceId，不直接保存整个 place。
    // 这样 placesGeoJson 更新后，详情面板能自动拿到最新数据。
    return (
      placesGeoJson.features.find(
        (place) => place.properties.placeId === selectedPlaceId,
      ) ?? null
    );
  }, [placesGeoJson.features, selectedPlaceId]);

  const sortedPlaces = useMemo(() => {
    // 左侧列表按照最新记事时间排序，最近发生的地点放在前面。
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
      // 地图和左侧列表共用同一份 GeoJSON 数据。
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
      // 选择地点时，只记录 id，具体地点数据由 selectedPlace 计算出来。
      setSelectedPlaceId(placeId);

      if (isMobile && placeId !== null) {
        // 手机端选择地点后收起地点列表，把屏幕空间留给地图和详情弹窗。
        setIsSidebarVisible(false);
      }
    },
    [isMobile],
  );

  const handleCreateAtLocation = useCallback((lng: number, lat: number) => {
    // 点击地图空白处代表要创建全新的地点。
    // 这里先清空旧选中状态，避免旧地点详情继续显示。
    setSelectedPlaceId(null);

    setFormTarget({
      type: "new-place",
      lng,
      lat,
    });
  }, []);

  const handleAddNoteToSelectedPlace = useCallback(() => {
    if (!selectedPlace) return;

    // 在已有地点新增记事时，不需要经纬度，直接使用当前地点 id。
    setFormTarget({
      type: "existing-place",
      placeId: selectedPlace.properties.placeId,
    });
  }, [selectedPlace]);

  const handleEditNote = useCallback(
    (note: NoteSummary) => {
      if (!selectedPlace) return;

      // 编辑记事时，把原始 note 放进 formTarget，表单会用它填默认值。
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

    // 请求开始后禁用表单，防止用户重复点击 Save。
    setIsSavingNote(true);

    try {
      if (formTarget.type === "new-place") {
        // 新地点需要一次性创建 place 和第一条 note。
        const createdPlace = await createPlaceWithNoteApi({
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

        setFormTarget(null);
        await fetchPlaces();
        // 保存成功后自动选中新地点，让用户马上看到刚创建的内容。
        setSelectedPlaceId(createdPlace.placeId);
        showToast("Note saved", "success");

        return;
      } else if (formTarget.type === "existing-place") {
        // 已有地点新增 note，只调用地点下的 notes 接口。
        await createNoteInPlaceApi(formTarget.placeId, {
          title: values.title,
          content: values.content,
          category: values.category,
          eventTime: values.eventTime,
        });
      } else {
        // 编辑 note 时不改变地点，只更新 note 自己的字段。
        await updateNoteInPlaceApi(formTarget.placeId, formTarget.note.id, {
          title: values.title,
          content: values.content,
          category: values.category,
          eventTime: values.eventTime,
        });
      }

      setFormTarget(null);
      await fetchPlaces();
      // 同一个表单可能是新增，也可能是编辑，所以提示文案按类型区分。
      showToast(
        formTarget.type === "edit-note" ? "Note updated" : "Note saved",
        "success",
      );
    } catch (error) {
      console.error(error);
      // 失败时保留表单，让用户可以检查内容后再次保存。
      showToast("Could not save note. Please try again.", "error");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = useCallback(
    async (note: NoteSummary) => {
      if (!selectedPlace) return;

      // 如果这是最后一条 note，后端会同时删除空 place，所以确认文案要提前说明。
      const isLastNote = selectedPlace.properties.noteCount <= 1;
      const confirmed = window.confirm(
        isLastNote
          ? "Delete this note? This is the last note here, so the place will also be deleted."
          : "Delete this note?",
      );

      if (!confirmed) return;

      // 只记录正在删除的 note id，这样页面可以只禁用对应那条 note 的按钮。
      setDeletingNoteId(note.id);

      try {
        await deleteNoteInPlaceApi(selectedPlace.properties.placeId, note.id);

        if (isLastNote) {
          // 最后一条 note 删除后 place 不存在了，所以清掉当前选中地点。
          setSelectedPlaceId(null);
        }

        await fetchPlaces();
        showToast("Note deleted", "success");
      } catch (error) {
        console.error(error);
        // 删除失败时不改变当前详情，用户还能继续查看和重试。
        showToast("Could not delete note. Please try again.", "error");
      } finally {
        setDeletingNoteId(null);
      }
    },
    [fetchPlaces, selectedPlace, showToast],
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

    // 删除整个地点时，锁住 Delete place 按钮，避免重复提交删除请求。
    setIsDeletingPlace(true);

    try {
      await deletePlaceApi(selectedPlace.properties.placeId);
      // place 已经不存在，当前选中状态必须清空。
      setSelectedPlaceId(null);
      await fetchPlaces();
      showToast("Place deleted", "success");
    } catch (error) {
      console.error(error);
      // 删除失败时保留当前地点详情，方便用户重新操作。
      showToast("Could not delete place. Please try again.", "error");
    } finally {
      setIsDeletingPlace(false);
    }
  }, [fetchPlaces, selectedPlace, showToast]);

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
              deletingNoteId={deletingNoteId}
              isDeletingPlace={isDeletingPlace}
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
              deletingNoteId={deletingNoteId}
              isDeletingPlace={isDeletingPlace}
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
                  category: formTarget.note.category as NoteFormValues["category"],
                  eventTime: formTarget.note.eventTime,
                }
              : undefined
          }
          isMobile={isMobile}
          isSaving={isSavingNote}
          onSave={handleSaveNote}
          onCancel={() => {
            // 保存中不允许关闭弹窗，避免用户误以为请求已经取消。
            if (!isSavingNote) setFormTarget(null);
          }}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} isMobile={isMobile} />
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
