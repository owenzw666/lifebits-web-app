import { useEffect, useMemo, useState } from "react";
import {
  deleteNotApi,
  getNotesApi,
  type Note,
} from "../api/notesApi";
import MapView from "../components/MapView";
import { groupByLocation } from "../utils/group";
import NoteList from "../components/NoteList";

const Notes = () => {
  type SidebarMode = "all" | "location";

  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [filter, setFilter] = useState<"all" | "today" | "month">("all");

  //Sidebar view mode status
  const [sidebarMode, setSiderbarMode] = useState<SidebarMode>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        await getNotesApi();
        const data: Note[] = [
          {
            id: 1,
            title: "徒步",
            content: "一家三口去红岩石的海边徒步",
            eventTime: "2026-04-25T01:56:00",
            createdAt: "2026-04-25T01:56:00",
            lng: 174.9,
            lat: -41.4,
          },
        ];
        setNotes(data);
      } catch (error) {
        console.error("Failed to get notes：", error);
      }
    };
    fetchNotes();
  }, []);

  // const handlesaveNote = async (data: any) => {
  //   try {
  //     if (data.id) {
  //       const updated = await updateNoteApi(data.id, data);
  //       setNotes((prev) => prev.map((n) => (n.id == updated.id ? updated : n)));
  //     } else {
  //       const createdNote = await createNoteApi(data);
  //       setNotes((prev) => [...prev, createdNote]);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteNote = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure to delete this note?");

    if (!confirmDelete) return;
    try {
      await deleteNotApi(id);
      setNotes((prev) => prev.filter((n) => n.id != id));

      // 如果删除的是当前选中的 note → 清空选中
      setSelectedNote((prev) => (prev?.id === id ? null : prev));
    } catch (error) {
      console.error(error);
    }
  };

  const sortedNotes = useMemo(() => {
    return [...notes].sort(
      (a, b) =>
        new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
    );
  }, [notes]);

  const now = new Date();
  //Filter notes
  const filteredNotes = useMemo(() => {
    return sortedNotes.filter((note) => {
      const d = new Date(note.eventTime);

      if (filter === "today") {
        return d.toDateString() === now.toDateString();
      }

      if (filter === "month") {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      }

      return true;
    });
  }, [sortedNotes, filter]);

  //Get groups of notes
  const groups = useMemo(() => groupByLocation(filteredNotes), [filteredNotes]);
  //Get selected group and display them when sidebarMode is "location"
  //Update it when groups or selectedGroupId is changed
  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return groups.find((g) => g.key === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "30%", overflowY: "auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px",
          }}
        >
          {sidebarMode === "location" && (
            <button
              onClick={() => {
                setSiderbarMode("all");
                setSelectedGroupId(null);
              }}
            >
              ← Back
            </button>
          )}
          <h2 style={{ margin: 0 }}>
            {sidebarMode === "all"
              ? "My Notes"
              : `📍 ${selectedGroup?.notes.length} notes`}
          </h2>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", padding: "0 10px 10px" }}>
          {["all", "today", "month"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: filter === f ? "#2563eb" : "#eee",
                color: filter === f ? "#fff" : "#333",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {sidebarMode === "all" && (
          <NoteList
            notes={filteredNotes}
            selectedNote={selectedNote}
            onSelect={setSelectedNote}
            onDelete={handleDeleteNote}
          />
        )}

        {sidebarMode === "location" && selectedGroup && (
          <NoteList
            notes={selectedGroup.notes}
            selectedNote={selectedNote}
            onSelect={setSelectedNote}
            onDelete={handleDeleteNote}
          />
        )}
      </div>
      <div style={{ width: "70%" }}>
        <MapView
        />
      </div>
    </div>
  );
};

export default Notes;