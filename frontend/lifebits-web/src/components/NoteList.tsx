import type { Note } from "../api/notesApi";
import NoteItem from "./NoteItem";

interface Props {
  notes: Note[];
  selectedNote: Note | null;
  onSelect: (note: Note) => void;
  onDelete: (id: number) => void;
}

const NotesList = ({ notes, selectedNote, onSelect, onDelete }: Props) => {
  return (
    <div>
      {notes.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          isActive={selectedNote?.id === note.id}
          onClick={() => onSelect(note)}
          onDelete={() => onDelete(note.id)}
        />
      ))}
    </div>
  );
};

export default NotesList;