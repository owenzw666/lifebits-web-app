import { useEffect, useState } from "react";
import { getNotesApi, type Note} from "../api/notesApi";


const Notes = () => {
  const [notes, setNotes] =useState<Note[]>([]);

  // 页面加载时拉取数据
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data=await getNotesApi();
        setNotes(data);
      } catch (error) {
        console.error("获取 notes 失败：", error);
      }
    };

    fetchNotes();
  }, []);

  return (
    <div>
      <h2>My Notes</h2>

      {notes.map((note) => (
        <div key={note.id} style={{ border: "1px solid #ccc", margin: 10 }}>
          <h3>{note.title}</h3>
          <p>{note.content}</p>
        </div>
      ))}
    </div>
  );
};

export default Notes;