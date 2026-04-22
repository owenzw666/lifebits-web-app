import { useEffect, useState } from "react";
import { createNoteApi, getNotesApi, type Note } from "../api/notesApi";
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

  const handleAddNote = async (data: {
    title: string;
    content: string;
    lat: number;
    lng: number;
    eventTime: string;
  }) => {
    try {
      const createdNote = await createNoteApi(data);

      setNotes((prev) => [...prev, createdNote]);
    } catch (error) {
      console.error("创建失败:", error);
    }
  };
  
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "30%", overflowY: "auto" }}>
        <h2>My Notes</h2>

        {notes.map((note) => (
          <div key={note.id} style={{ border: "1px solid #ccc", margin: 10 }}>
            <h3>{note.title}</h3>
            <p>{note.content}</p>
          </div>
        ))}
      </div>
      <div style={{ width: "70%" }}>
        <MapView notes={notes} onAddNote={handleAddNote} />
      </div>
    </div>
  );
};

export default Notes;
