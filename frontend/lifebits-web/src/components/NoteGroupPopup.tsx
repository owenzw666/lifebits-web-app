import type { NoteGroup } from "../utils/group";
import { formatDisplayTime } from "../utils/time";

interface Props {
  group: NoteGroup;
  onSelectNote: (noteId: number) => void;
  onAdd: () => void;
}

const NoteGroupPopup = ({ group, onSelectNote, onAdd }: Props) => {
  return (
    <div style={{ width: 260 }}>
      <div style={{ padding: 8, fontWeight: 600 }}>
        📍 {group.notes.length} notes
      </div>

      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {group.notes.map((n) => (
          <div
            key={n.id}
            onClick={() => onSelectNote(n.id)}
            style={{
              padding: 8,
              borderBottom: "1px solid #eee",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: 12, color: "#666" }}>
              {formatDisplayTime(n.eventTime)}
            </div>
            <div>{n.content}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 8 }}>
        <button onClick={onAdd}>+ Add note</button>
      </div>
    </div>
  );
};

export default NoteGroupPopup;