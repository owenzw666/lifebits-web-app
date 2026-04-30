import { useEffect, useState } from "react";
import {
  createNoteApi,
  deleteNotApi,
  getNotesApi,
  updateNoteApi,
  type Note,
} from "../api/notesApi";
import MapView from "../components/MapView";

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

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

        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => setSelectedNote(note)}
            style={{
              border: "1px solid #ccc",
              margin: 10,
              padding: 8,
              cursor: "pointer",
              background: selectedNote?.id === note.id ? "#eef2ff" : "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>{note.title}</h3>

              <button
                onClick={() => handleDeleteNote(note.id)}
                style={{
                  background: "red",
                  color: "#fff",
                  border: "none",
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>

            <p>{note.content}</p>
          </div>
        ))}
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
