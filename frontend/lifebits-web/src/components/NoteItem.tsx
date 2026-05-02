import { useState } from "react";
import { formatDisplayTime } from "../utils/time";
import type { Note } from "../api/notesApi";

interface Props {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

const NoteItem = ({ note, isActive, onClick, onDelete }: Props) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        margin: "8px 12px",
        padding: "10px",
        borderRadius: "10px",
        cursor: "pointer",
        background: isActive ? "#eef2ff" : hover ? "#f8fafc" : "#fff",
        boxShadow: isActive
          ? "0 2px 6px rgba(37,99,235,0.2)"
          : "0 1px 3px rgba(0,0,0,0.05)",
        transform: hover ? "scale(1.01)" : "scale(1)",
        transition: "all 0.15s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500 }}>
            {note.title || formatDisplayTime(note.eventTime)}
          </div>

          <div style={{ fontSize: "12px", color: "#666" }}>
            {formatDisplayTime(note.eventTime)}
          </div>
        </div>

        {/* Delete icon（hover 才明显） */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            opacity: hover ? 1 : 0.3,
            transition: "opacity 0.2s",
          }}
        >
          🗑
        </button>
      </div>

      {/* Content preview */}
      <div
        style={{
          marginTop: "6px",
          fontSize: "13px",
          color: "#444",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {note.content}
      </div>
    </div>
  );
};

export default NoteItem;