import { useMemo, useState } from "react";
import { formatDisplayTime, toISO, toLocalInput } from "../utils/time";
import {
  defaultNoteCategory,
  getNoteCategoryOption,
  noteCategoryOptions,
  type NoteCategory,
} from "../utils/noteCategories";
import type { NoteFormValues } from "./NoteFormPopup";
import type { NoteSummary, PlaceFeature } from "../types/geojson";

interface Props {
  place: PlaceFeature;
  variant: "sidebar" | "sheet";
  onAddNote: () => void;
  onUpdateNote: (
    note: NoteSummary,
    values: NoteFormValues,
  ) => Promise<boolean>;
  onUpdatePlace: (name: string) => Promise<boolean>;
  onDeleteNote: (note: NoteSummary) => void;
  onDeletePlace: () => void;
  deletingNoteId: number | null;
  isDeletingPlace: boolean;
  isSaving: boolean;
  onClose: () => void;
}

interface NoteDraft {
  noteId: number;
  title: string;
  content: string;
  category: NoteCategory;
  eventTime: string;
}

const PlaceNotesPopup = ({
  place,
  variant,
  onAddNote,
  onUpdateNote,
  onUpdatePlace,
  onDeleteNote,
  onDeletePlace,
  deletingNoteId,
  isDeletingPlace,
  isSaving,
  onClose,
}: Props) => {
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [placeNameDraft, setPlaceNameDraft] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const isSheet = variant === "sheet";

  const sortedNotes = useMemo(() => {
    return [...place.properties.notes].sort(
      (a, b) =>
        new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime(),
    );
  }, [place.properties.notes]);

  const selectedNote =
    sortedNotes.find((note) => note.id === selectedNoteId) ?? null;
  const placeDisplayName =
    place.properties.name || `Place #${place.properties.placeId}`;
  const originalPlaceName = place.properties.name ?? "";
  const isPlaceDirty =
    placeNameDraft !== null && placeNameDraft !== originalPlaceName;

  const isNoteDirty = (() => {
    if (!noteDraft || !selectedNote) return false;

    return (
      noteDraft.title !== selectedNote.title ||
      noteDraft.content !== selectedNote.content ||
      noteDraft.category !== normalizeCategory(selectedNote.category) ||
      noteDraft.eventTime !== toLocalInput(selectedNote.eventTime)
    );
  })();

  const confirmDiscard = (isDirty: boolean) => {
    return !isDirty || window.confirm("Discard unsaved changes?");
  };

  const stopEditing = () => {
    setPlaceNameDraft(null);
    setNoteDraft(null);
  };

  const handleClose = () => {
    if (isSaving) return;
    if (!confirmDiscard(isPlaceDirty || isNoteDirty)) return;

    stopEditing();
    onClose();
  };

  const handleBackToNotes = () => {
    if (isSaving) return;
    if (!confirmDiscard(isNoteDirty)) return;

    setNoteDraft(null);
    setSelectedNoteId(null);
  };

  const startPlaceEditing = () => {
    if (isSaving) return;
    if (!confirmDiscard(isNoteDirty)) return;

    setNoteDraft(null);
    setPlaceNameDraft(originalPlaceName);
  };

  const startNoteEditing = (note: NoteSummary) => {
    if (isSaving) return;
    if (!confirmDiscard(isPlaceDirty)) return;

    setPlaceNameDraft(null);
    setNoteDraft({
      noteId: note.id,
      title: note.title,
      content: note.content,
      category: normalizeCategory(note.category),
      eventTime: toLocalInput(note.eventTime),
    });
  };

  const savePlaceName = async () => {
    if (placeNameDraft === null) return;

    if (!isPlaceDirty) {
      setPlaceNameDraft(null);
      return;
    }

    if (await onUpdatePlace(placeNameDraft)) {
      setPlaceNameDraft(null);
    }
  };

  const saveNote = async () => {
    if (!noteDraft || !selectedNote) return;

    if (!noteDraft.content.trim()) {
      alert("Content is required");
      return;
    }

    if (!isNoteDirty) {
      setNoteDraft(null);
      return;
    }

    const saved = await onUpdateNote(selectedNote, {
      title: noteDraft.title.trim(),
      content: noteDraft.content.trim(),
      category: noteDraft.category,
      eventTime: toISO(noteDraft.eventTime),
    });

    if (saved) {
      setNoteDraft(null);
    }
  };

  const content = (
    <section
      aria-label={`${placeDisplayName} notes`}
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
      {isSheet && <SheetHandle />}

      <header style={headerStyle}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <button onClick={handleClose} style={backButtonStyle}>
            Back
          </button>

          {placeNameDraft !== null ? (
            <div style={{ marginTop: "10px" }}>
              <input
                value={placeNameDraft}
                disabled={isSaving}
                onChange={(event) => setPlaceNameDraft(event.target.value)}
                aria-label="Place name"
                style={placeNameInputStyle}
                autoFocus
              />
              <ActionButtons
                isSaving={isSaving}
                saveLabel="Save place"
                onCancel={() => setPlaceNameDraft(null)}
                onSave={savePlaceName}
              />
            </div>
          ) : (
            <button
              onClick={startPlaceEditing}
              title="Edit place name"
              style={editablePlaceNameStyle}
            >
              {placeDisplayName}
            </button>
          )}

          <div style={noteCountStyle}>{place.properties.noteCount} notes</div>
        </div>

        {isSheet && (
          <button
            onClick={handleClose}
            aria-label="Close place notes"
            style={iconButtonStyle}
          >
            x
          </button>
        )}
      </header>

      <div style={scrollAreaStyle}>
        {selectedNote ? (
          <NoteDetail
            note={selectedNote}
            draft={
              noteDraft?.noteId === selectedNote.id ? noteDraft : null
            }
            isDeleting={deletingNoteId === selectedNote.id}
            isSaving={isSaving}
            onBack={handleBackToNotes}
            onStartEditing={() => startNoteEditing(selectedNote)}
            onChangeDraft={setNoteDraft}
            onCancelEditing={() => setNoteDraft(null)}
            onSave={saveNote}
            onDelete={() => onDeleteNote(selectedNote)}
          />
        ) : (
          <NoteList notes={sortedNotes} onSelectNote={setSelectedNoteId} />
        )}
      </div>

      {!selectedNote && placeNameDraft === null && (
        <footer style={footerStyle}>
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
    <div onClick={handleClose} style={sheetBackdropStyle}>
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
  return (
    <div style={{ padding: "6px 16px 16px" }}>
      {notes.map((note) => (
        <NoteListItem key={note.id} note={note} onSelect={onSelectNote} />
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
    <button onClick={() => onSelect(note.id)} style={noteListItemStyle}>
      <div style={noteListTitleRowStyle}>
        <div style={noteListTitleStyle}>
          {note.title || formatDisplayTime(note.eventTime)}
        </div>
        <CategoryBadge category={category} />
      </div>
      <div style={noteListTimeStyle}>{formatDisplayTime(note.eventTime)}</div>
      <div style={noteListContentStyle}>{note.content}</div>
    </button>
  );
};

const NoteDetail = ({
  note,
  draft,
  isDeleting,
  isSaving,
  onBack,
  onStartEditing,
  onChangeDraft,
  onCancelEditing,
  onSave,
  onDelete,
}: {
  note: NoteSummary;
  draft: NoteDraft | null;
  isDeleting: boolean;
  isSaving: boolean;
  onBack: () => void;
  onStartEditing: () => void;
  onChangeDraft: (draft: NoteDraft) => void;
  onCancelEditing: () => void;
  onSave: () => void;
  onDelete: () => void;
}) => {
  const category = getNoteCategoryOption(note.category);

  if (draft) {
    const updateDraft = (changes: Partial<NoteDraft>) => {
      onChangeDraft({
        ...draft,
        ...changes,
      });
    };

    return (
      <div style={{ padding: "16px" }}>
        <button onClick={onBack} disabled={isSaving} style={secondaryButtonStyle}>
          Back to notes
        </button>

        <input
          value={draft.title}
          disabled={isSaving}
          onChange={(event) => updateDraft({ title: event.target.value })}
          placeholder="Title (optional)"
          aria-label="Note title"
          style={{ ...inlineInputStyle, marginTop: "18px" }}
          autoFocus
        />

        <input
          type="datetime-local"
          value={draft.eventTime}
          disabled={isSaving}
          onChange={(event) => updateDraft({ eventTime: event.target.value })}
          aria-label="Note time"
          style={inlineInputStyle}
        />

        <select
          value={draft.category}
          disabled={isSaving}
          onChange={(event) =>
            updateDraft({ category: event.target.value as NoteCategory })
          }
          aria-label="Note category"
          style={inlineInputStyle}
        >
          {noteCategoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <textarea
          value={draft.content}
          disabled={isSaving}
          onChange={(event) => updateDraft({ content: event.target.value })}
          placeholder="Write something..."
          aria-label="Note content"
          style={inlineTextareaStyle}
        />

        <ActionButtons
          isSaving={isSaving}
          saveLabel="Save changes"
          onCancel={onCancelEditing}
          onSave={onSave}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <button onClick={onBack} style={secondaryButtonStyle}>
        Back to notes
      </button>

      <button onClick={onStartEditing} style={editableNoteTitleStyle}>
        {note.title || "Untitled note"}
      </button>

      <button onClick={onStartEditing} style={editableTimeStyle}>
        {formatDisplayTime(note.eventTime)}
      </button>

      <button onClick={onStartEditing} style={editableCategoryStyle}>
        <CategoryBadge category={category} />
      </button>

      <button onClick={onStartEditing} style={editableContentStyle}>
        {note.content}
      </button>

      <div style={noteActionRowStyle}>
        <button
          onClick={onStartEditing}
          disabled={isDeleting}
          style={{
            ...secondaryButtonStyle,
            cursor: isDeleting ? "not-allowed" : "pointer",
            opacity: isDeleting ? 0.65 : 1,
          }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          style={{
            ...dangerButtonStyle,
            cursor: isDeleting ? "not-allowed" : "pointer",
            opacity: isDeleting ? 0.7 : 1,
          }}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
};

const ActionButtons = ({
  isSaving,
  saveLabel,
  onCancel,
  onSave,
}: {
  isSaving: boolean;
  saveLabel: string;
  onCancel: () => void;
  onSave: () => void;
}) => {
  return (
    <div style={actionButtonRowStyle}>
      <button
        onClick={onCancel}
        disabled={isSaving}
        style={{
          ...secondaryButtonStyle,
          opacity: isSaving ? 0.65 : 1,
        }}
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        style={{
          ...primaryButtonStyle,
          opacity: isSaving ? 0.72 : 1,
        }}
      >
        {isSaving ? "Saving..." : saveLabel}
      </button>
    </div>
  );
};

const CategoryBadge = ({
  category,
}: {
  category: ReturnType<typeof getNoteCategoryOption>;
}) => (
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

const SheetHandle = () => (
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
);

const normalizeCategory = (category: string): NoteCategory => {
  return noteCategoryOptions.some((option) => option.value === category)
    ? (category as NoteCategory)
    : defaultNoteCategory;
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
  padding: "16px",
  borderBottom: "1px solid #e5e7eb",
  background: "#ffffff",
} as const;

const scrollAreaStyle = {
  flex: 1,
  overflowY: "auto",
  overscrollBehavior: "contain",
} as const;

const footerStyle = {
  padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
  borderTop: "1px solid #e5e7eb",
  background: "#ffffff",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "10px",
} as const;

const sheetBackdropStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 25,
  display: "flex",
  alignItems: "flex-end",
  background: "rgba(15, 23, 42, 0.28)",
} as const;

const noteCountStyle = {
  marginTop: "4px",
  fontSize: "13px",
  color: "#6b7280",
} as const;

const editablePlaceNameStyle = {
  display: "block",
  width: "100%",
  margin: "10px 0 0",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#111827",
  cursor: "text",
  textAlign: "left",
  fontSize: "19px",
  fontWeight: 700,
  lineHeight: 1.25,
  overflowWrap: "anywhere",
} as const;

const placeNameInputStyle = {
  width: "100%",
  minHeight: "42px",
  boxSizing: "border-box",
  padding: "9px 10px",
  border: "1px solid #93c5fd",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#111827",
  fontSize: "17px",
  fontWeight: 650,
} as const;

const inlineInputStyle = {
  width: "100%",
  minHeight: "44px",
  boxSizing: "border-box",
  marginTop: "10px",
  padding: "10px 11px",
  border: "1px solid #93c5fd",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#111827",
  fontSize: "16px",
} as const;

const inlineTextareaStyle = {
  ...inlineInputStyle,
  minHeight: "180px",
  resize: "vertical",
  fontFamily: "inherit",
  lineHeight: 1.6,
} as const;

const editableNoteTitleStyle = {
  display: "block",
  width: "100%",
  margin: "18px 0 4px",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#111827",
  cursor: "text",
  textAlign: "left",
  fontSize: "19px",
  fontWeight: 700,
  lineHeight: 1.3,
  overflowWrap: "anywhere",
} as const;

const editableTimeStyle = {
  display: "block",
  margin: 0,
  padding: "3px 0",
  border: "none",
  background: "transparent",
  color: "#6b7280",
  cursor: "text",
  fontSize: "13px",
} as const;

const editableCategoryStyle = {
  display: "block",
  marginTop: "7px",
  padding: "3px 0",
  border: "none",
  background: "transparent",
  cursor: "pointer",
} as const;

const editableContentStyle = {
  display: "block",
  width: "100%",
  minHeight: "80px",
  marginTop: "13px",
  padding: "3px 0",
  border: "none",
  background: "transparent",
  color: "#374151",
  cursor: "text",
  textAlign: "left",
  whiteSpace: "pre-wrap",
  lineHeight: 1.65,
  fontSize: "16px",
  overflowWrap: "anywhere",
} as const;

const actionButtonRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginTop: "16px",
} as const;

const noteActionRowStyle = {
  ...actionButtonRowStyle,
  marginTop: "22px",
} as const;

const noteListItemStyle = {
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
} as const;

const noteListTitleRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
} as const;

const noteListTitleStyle = {
  minWidth: 0,
  fontSize: "15px",
  fontWeight: 650,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const noteListTimeStyle = {
  marginTop: "4px",
  fontSize: "12px",
  color: "#6b7280",
} as const;

const noteListContentStyle = {
  marginTop: "8px",
  fontSize: "14px",
  color: "#374151",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

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
