import { useMemo } from "react";
import type { NoteGroup } from "../utils/group";
import { formatDisplayTime } from "../utils/time";

interface Props {
  group: NoteGroup;
  onSelectNote: (noteId: number) => void;
  onAdd: () => void;
  onViewMore: (groupId: string) => void;
}

const MAX_PREVIEW = 5; //The maximum initial display quantity

const NoteGroupPopup = ({ group, onSelectNote, onAdd, onViewMore }: Props) => {
    //Ordering in Time
  const sortedNotes = useMemo(() => {
    return [...group.notes].sort(
      (a, b) =>
        new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
    );
  }, [group.notes]);

  //Obtain the initially displayed notes
  const previewNotes = sortedNotes.slice(0, MAX_PREVIEW);
  //The number of undisplayed notes
  const remainingCount = group.notes.length - previewNotes.length;

  return (
    <div style={{ width: 260 }}>
      {/* Header */}
      <div style={{ padding: 8, fontWeight: 600 }}>
        📍 {group.notes.length} notes
      </div>

      {/* Preview List */}
      <div>
        {previewNotes.map((n) => (
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
            <div
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {n.content}
            </div>
          </div>
        ))}
      </div>

      {/* View More */}
      {remainingCount > 0 && (
        <div
          onClick={() => onViewMore(group.key)}
          style={{
            padding: 8,
            textAlign: "center",
            cursor: "pointer",
            color: "#007aff",
            borderBottom: "1px solid #eee",
          }}
        >
          View {remainingCount} more →
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: 8 }}>
        <button onClick={onAdd}>+ Add note</button>
      </div>
    </div>
  );
};

export default NoteGroupPopup;
