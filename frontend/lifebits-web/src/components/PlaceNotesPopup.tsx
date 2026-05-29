import { useMemo, useState } from "react";
import { formatDisplayTime } from "../utils/time";
import type { NoteSummary, PlaceFeature } from "../types/geojson";

interface Props {
  place: PlaceFeature;
  onAddNote: () => void;
  onClose: () => void;
}

const PlaceNotesPopup = ({ place, onAddNote, onClose }: Props) => {
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);

  const sortedNotes = useMemo(() => {
    return [...place.properties.notes].sort(
      (a, b) =>
        new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
    );
  }, [place.properties.notes]);

  const selectedNote =
    sortedNotes.find((note) => note.id === selectedNoteId) ?? null;
  const placeName = place.properties.name || `Place #${place.properties.placeId}`;

  return (
    <div
      onClick={onClose}
      style={{
        maxHeight: "calc(100vh - 200px)", // 稍微调小一点，防止气泡高过地图范围
        overflow: "auto",
        borderRadius: "10px",
        background: "#ffffff",
        color: "#111827",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(520px, calc(100vw - 32px))",
          maxHeight: "calc(100vh - 48px)",
          overflow: "auto",
          borderRadius: "10px",
          background: "#ffffff",
          color: "#111827",
          boxShadow: "0 20px 45px rgba(15, 23, 42, 0.24)",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "flex-start",
            padding: "16px",
            borderBottom: "1px solid #e5e7eb",
            background: "#ffffff",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "19px" }}>{placeName}</h2>
            <div
              style={{
                marginTop: "4px",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              {place.properties.noteCount} notes
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onAddNote} style={primaryButtonStyle}>
              Add note here
            </button>
            <button
              onClick={onClose}
              aria-label="Close place notes"
              style={iconButtonStyle}
            >
              x
            </button>
          </div>
        </div>

        {selectedNote ? (
          <NoteDetail
            note={selectedNote}
            onBack={() => setSelectedNoteId(null)}
          />
        ) : (
          <div style={{ padding: "8px 16px 16px" }}>
            {sortedNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                style={{
                  width: "100%",
                  display: "block",
                  textAlign: "left",
                  padding: "12px 0",
                  border: "none",
                  borderBottom: "1px solid #f3f4f6",
                  background: "transparent",
                  color: "#111827",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 600 }}>
                  {note.title || formatDisplayTime(note.eventTime)}
                </div>
                <div
                  style={{
                    marginTop: "3px",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  {formatDisplayTime(note.eventTime)}
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "14px",
                    color: "#374151",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {note.content}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NoteDetail = ({
  note,
  onBack,
}: {
  note: NoteSummary;
  onBack: () => void;
}) => {
  return (
    <div style={{ padding: "16px" }}>
      <button onClick={onBack} style={secondaryButtonStyle}>
        Back
      </button>
      <h3 style={{ margin: "16px 0 4px", fontSize: "18px" }}>
        {note.title || "Untitled note"}
      </h3>
      <div style={{ fontSize: "13px", color: "#6b7280" }}>
        {formatDisplayTime(note.eventTime)}
      </div>

      {/* Preserve line breaks from user-entered note content. */}
      <p
        style={{
          marginTop: "16px",
          whiteSpace: "pre-wrap",
          lineHeight: 1.6,
          color: "#374151",
        }}
      >
        {note.content}
      </p>
    </div>
  );
};

const primaryButtonStyle = {
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "13px",
} as const;

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "7px 12px",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  fontSize: "13px",
} as const;

const iconButtonStyle = {
  ...secondaryButtonStyle,
  width: "34px",
  padding: 0,
  fontSize: "18px",
} as const;

export default PlaceNotesPopup;
