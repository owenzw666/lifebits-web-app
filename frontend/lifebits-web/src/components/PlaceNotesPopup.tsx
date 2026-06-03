import { useMemo, useState } from "react";
import { formatDisplayTime } from "../utils/time";
import { getNoteCategoryOption } from "../utils/noteCategories";
import type { NoteSummary, PlaceFeature } from "../types/geojson";

interface Props {
  place: PlaceFeature;
  variant: "sidebar" | "sheet";
  onAddNote: () => void;
  onEditNote: (note: NoteSummary) => void;
  onDeleteNote: (note: NoteSummary) => void;
  onDeletePlace: () => void;
  deletingNoteId: number | null;
  isDeletingPlace: boolean;
  onClose: () => void;
}

const PlaceNotesPopup = ({
  place,
  variant,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onDeletePlace,
  deletingNoteId,
  isDeletingPlace,
  onClose,
}: Props) => {
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const isSheet = variant === "sheet";

  const sortedNotes = useMemo(() => {
    // Show newer notes first so the most recent memory is easiest to find.
    return [...place.properties.notes].sort(
      (a, b) =>
        new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
    );
  }, [place.properties.notes]);

  // Keep only the selected note id in state.
  // This lets the detail view refresh automatically when the place data updates.
  const selectedNote =
    sortedNotes.find((note) => note.id === selectedNoteId) ?? null;
  const isSelectedNoteDeleting =
    selectedNote !== null && deletingNoteId === selectedNote.id;
  const placeName = place.properties.name || `Place #${place.properties.placeId}`;

  const content = (
    <section
      aria-label={`${placeName} notes`}
      style={{
        height: isSheet ? "min(78dvh, 680px)" : "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: isSheet ? "18px 18px 0 0" : 0,
        background: "#ffffff",
        color: "#111827",
        overflow: "hidden",
        boxShadow: isSheet ? "0 -18px 40px rgba(15, 23, 42, 0.24)" : "none",
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {isSheet && (
        <div
          aria-hidden="true"
          style={{
            width: "44px",
            height: "5px",
            borderRadius: "999px",
            background: "#d1d5db",
            margin: "10px auto 2px",
          }}
        />
      )}

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "flex-start",
          padding: isSheet ? "12px 16px 14px" : "16px",
          borderBottom: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <button onClick={onClose} style={backButtonStyle}>
            Back
          </button>
          <h2
            style={{
              margin: "10px 0 0",
              fontSize: "19px",
              lineHeight: 1.25,
              overflowWrap: "anywhere",
            }}
          >
            {placeName}
          </h2>
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

        {isSheet && (
          <button
            onClick={onClose}
            aria-label="Close place notes"
            style={iconButtonStyle}
          >
            x
          </button>
        )}
      </header>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        {selectedNote ? (
          <NoteDetail
            note={selectedNote}
            isDeleting={isSelectedNoteDeleting}
            onBack={() => setSelectedNoteId(null)}
            onEdit={() => onEditNote(selectedNote)}
            onDelete={() => onDeleteNote(selectedNote)}
          />
        ) : (
          <NoteList notes={sortedNotes} onSelectNote={setSelectedNoteId} />
        )}
      </div>

      {!selectedNote && (
        <footer
          style={{
            padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
            borderTop: "1px solid #e5e7eb",
            background: "#ffffff",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "10px",
          }}
        >
          <button onClick={onAddNote} style={primaryButtonStyle}>
            Add note here
          </button>
          <button
            onClick={onDeletePlace}
            disabled={isDeletingPlace}
            style={{
              ...dangerOutlineButtonStyle,
              cursor: isDeletingPlace ? "not-allowed" : "pointer",
              opacity: isDeletingPlace ? 0.7 : 1,
            }}
          >
            {isDeletingPlace ? "Deleting place..." : "Delete place"}
          </button>
        </footer>
      )}
    </section>
  );

  if (!isSheet) return content;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 25,
        display: "flex",
        alignItems: "flex-end",
        background: "rgba(15, 23, 42, 0.28)",
      }}
    >
      <div style={{ width: "100%" }}>{content}</div>
    </div>
  );
};

const NoteList = ({
  notes,
  onSelectNote,
}: {
  notes: NoteSummary[];
  onSelectNote: (noteId: number) => void;
}) => {
  const handleSelect = (noteId: number) => {
    // Selecting a note switches the panel from list mode to detail mode.
    onSelectNote(noteId);
  };

  return (
    <div style={{ padding: "6px 16px 16px" }}>
      {notes.map((note) => (
        <NoteListItem key={note.id} note={note} onSelect={handleSelect} />
      ))}
    </div>
  );
};

const NoteListItem = ({
  note,
  onSelect,
}: {
  note: NoteSummary;
  onSelect: (noteId: number) => void;
}) => {
  const category = getNoteCategoryOption(note.category);

  return (
    <button
      onClick={() => onSelect(note.id)}
      style={{
        width: "100%",
        minHeight: "72px",
        display: "block",
        textAlign: "left",
        padding: "14px 0",
        border: "none",
        borderBottom: "1px solid #f3f4f6",
        background: "transparent",
        color: "#111827",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div
          style={{
            minWidth: 0,
            fontSize: "15px",
            fontWeight: 650,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {note.title || formatDisplayTime(note.eventTime)}
        </div>
        <CategoryBadge category={category} />
      </div>
      <div
        style={{
          marginTop: "4px",
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
  );
};

const NoteDetail = ({
  note,
  onBack,
  onEdit,
  onDelete,
  isDeleting,
}: {
  note: NoteSummary;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) => {
  const category = getNoteCategoryOption(note.category);
  const editButtonStyle = {
    ...secondaryButtonStyle,
    cursor: isDeleting ? "not-allowed" : "pointer",
    opacity: isDeleting ? 0.65 : 1,
  } as const;

  const deleteButtonStyle = {
    ...dangerButtonStyle,
    cursor: isDeleting ? "not-allowed" : "pointer",
    opacity: isDeleting ? 0.7 : 1,
  } as const;

  return (
    <div style={{ padding: "16px" }}>
      <button onClick={onBack} style={secondaryButtonStyle}>
        Back to notes
      </button>
      <h3
        style={{
          margin: "18px 0 4px",
          fontSize: "19px",
          lineHeight: 1.3,
          overflowWrap: "anywhere",
        }}
      >
        {note.title || "Untitled note"}
      </h3>
      <div style={{ fontSize: "13px", color: "#6b7280" }}>
        {formatDisplayTime(note.eventTime)}
      </div>
      <div style={{ marginTop: "10px" }}>
        <CategoryBadge category={category} />
      </div>

      <p
        style={{
          marginTop: "16px",
          whiteSpace: "pre-wrap",
          lineHeight: 1.65,
          color: "#374151",
          overflowWrap: "anywhere",
        }}
      >
        {note.content}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginTop: "22px",
        }}
      >
        <button
          onClick={onEdit}
          disabled={isDeleting}
          style={editButtonStyle}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          style={deleteButtonStyle}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
};

const CategoryBadge = ({
  category,
}: {
  category: ReturnType<typeof getNoteCategoryOption>;
}) => {
  return (
    <span
      style={{
        flex: "0 0 auto",
        maxWidth: "120px",
        padding: "4px 8px",
        borderRadius: "999px",
        border: `1px solid ${category.border}`,
        background: category.background,
        color: category.color,
        fontSize: "12px",
        fontWeight: 700,
        lineHeight: 1.2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {category.label}
    </span>
  );
};

const primaryButtonStyle = {
  width: "100%",
  minHeight: "46px",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 650,
} as const;

const secondaryButtonStyle = {
  minHeight: "40px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "8px 12px",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  fontSize: "14px",
} as const;

const dangerButtonStyle = {
  minHeight: "40px",
  border: "none",
  borderRadius: "8px",
  padding: "8px 12px",
  background: "#dc2626",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 650,
} as const;

const dangerOutlineButtonStyle = {
  width: "100%",
  minHeight: "44px",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  padding: "9px 14px",
  background: "#ffffff",
  color: "#b91c1c",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 650,
} as const;

const backButtonStyle = {
  ...secondaryButtonStyle,
  minHeight: "36px",
  padding: "7px 11px",
  fontSize: "13px",
} as const;

const iconButtonStyle = {
  width: "42px",
  height: "42px",
  flex: "0 0 auto",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: 0,
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  fontSize: "20px",
  lineHeight: 1,
} as const;

export default PlaceNotesPopup;
