import { useEffect, useState } from "react";
import {
  createNoteApi,
  getNotesApi,
  updateNoteApi,
  type Note,
} from "../api/notesApi";
import MapView from "../components/MapView";

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);

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
        console.info(updated);
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
      alert(error);
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
          <div key={note.id} style={{ border: "1px solid #ccc", margin: 10 }}>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
          </div>
        ))}
      </div>
      <div style={{ width: "70%" }}>
        <MapView notes={notes} onAddNote={handlesaveNote} />
      </div>
    </div>
  );
};

export default Notes;
