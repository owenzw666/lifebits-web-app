import { useEffect, useMemo, useState } from "react";
import {
  createNoteApi,
  deleteNotApi,
  getNotesApi,
  updateNoteApi,
  type Note,
} from "../api/notesApi";
import MapView from "../components/MapView";
import NoteList from "../components/noteList";

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [filter, setFilter] = useState<"all" | "today" | "month">("all");

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await getNotesApi();
        setNotes(data);
      } catch (error) {
        console.error("Failed to get notes：", error);
      }
    };
    fetchNotes();
  }, []);

  const handlesaveNote = async (data: any) => {
    try {
      //console.info(data);
      if (data.id) {
        const updated = await updateNoteApi(data.id, data);
        setNotes((prev) => prev.map((n) => (n.id == updated.id ? updated : n)));
      } else {
        const createdNote = await createNoteApi(data);
        setNotes((prev) => [...prev, createdNote]);
      }
    } catch (error) {
      console.error(error);
    }
  };

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

      // ⭐ 如果删除的是当前选中的 note → 清空选中
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
          <h2 style={{ margin: 0 }}>My Notes</h2>
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

        <NoteList
          notes={filteredNotes}
          selectedNote={selectedNote}
          onSelect={setSelectedNote}
          onDelete={handleDeleteNote}
        />
      </div>
      <div style={{ width: "70%" }}>
        <MapView
          notes={notes}
          onAddNote={handlesaveNote}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          onDeleteNote={handleDeleteNote}
        />
      </div>
    </div>
  );
};

export default Notes;
