import { useState } from "react";
import { toISO, toLocalInput } from "../utils/time";
import {
  defaultNoteCategory,
  noteCategoryOptions,
  type NoteCategory,
} from "../utils/noteCategories";

export interface NoteFormValues {
  title: string;
  content: string;
  category: NoteCategory;
  eventTime: string;
  placeName?: string;
}

interface Props {
  mode: "new-place" | "existing-place" | "edit-note";
  isMobile: boolean;
  initialValues?: NoteFormValues;
  isResolvingPlaceName?: boolean;
  isSaving: boolean;
  onSave: (values: NoteFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const NoteFormPopup = ({
  mode,
  isMobile,
  initialValues,
  isResolvingPlaceName = false,
  isSaving,
  onSave,
  onCancel,
}: Props) => {
  // Keep form input state inside this component.
  // Edit mode receives initialValues so the existing note can be changed in place.
  const [placeNameDraft, setPlaceNameDraft] = useState("");
  const [hasEditedPlaceName, setHasEditedPlaceName] = useState(false);
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [category, setCategory] = useState<NoteCategory>(
    initialValues?.category ?? defaultNoteCategory,
  );

  // datetime-local needs a local input string, not the raw ISO value from the API.
  const [eventTime, setEventTime] = useState(
    initialValues?.eventTime
      ? toLocalInput(initialValues.eventTime)
      : toLocalInput(new Date().toISOString()),
  );

  const placeNameValue = hasEditedPlaceName
    ? placeNameDraft
    : (initialValues?.placeName ?? "");

  const handleSubmit = () => {
    // For the MVP, content is required while title and place name can stay optional.
    if (!content.trim()) {
      alert("Content is required");
      return;
    }

    // Trim text fields before sending them upward, and convert the time back to ISO.
    onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      eventTime: toISO(eventTime),
      placeName: placeNameValue.trim() || undefined,
    });
  };

  const handleBackdropClick = () => {
    // Do not close the popup while a save request is running.
    // This avoids making the user think the request was cancelled.
    if (!isSaving) onCancel();
  };

  const closeButtonStyle = {
    ...iconButtonStyle,
    cursor: isSaving ? "not-allowed" : "pointer",
    opacity: isSaving ? 0.65 : 1,
  } as const;

  const disabledSecondaryButtonStyle = {
    ...secondaryButtonStyle,
    cursor: isSaving ? "not-allowed" : "pointer",
    opacity: isSaving ? 0.65 : 1,
  } as const;

  const saveButtonStyle = {
    ...primaryButtonStyle,
    cursor: isSaving ? "not-allowed" : "pointer",
    opacity: isSaving ? 0.72 : 1,
  } as const;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.38)",
        padding: isMobile ? 0 : "20px",
      }}
    >
      <section
        onClick={(event) => event.stopPropagation()}
        aria-label={mode === "edit-note" ? "Edit note" : "Add note"}
        style={{
          width: isMobile ? "100%" : "min(440px, calc(100vw - 32px))",
          maxHeight: isMobile ? "88dvh" : "calc(100dvh - 40px)",
          overflowY: "auto",
          padding: isMobile
            ? "14px 18px calc(18px + env(safe-area-inset-bottom))"
            : "20px",
          borderRadius: isMobile ? "18px 18px 0 0" : "10px",
          background: "#ffffff",
          color: "#111827",
          boxShadow: "0 20px 45px rgba(15, 23, 42, 0.24)",
          boxSizing: "border-box",
        }}
      >
        {isMobile && (
          <div
            aria-hidden="true"
            style={{
              width: 44,
              height: 5,
              borderRadius: 999,
              background: "#d1d5db",
              margin: "0 auto 12px",
            }}
          />
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "19px", lineHeight: 1.25 }}>
            {mode === "edit-note"
              ? "Edit note"
              : mode === "new-place"
                ? "New place note"
                : "Add note here"}
          </h2>
          <button
            onClick={onCancel}
            disabled={isSaving}
            style={closeButtonStyle}
            aria-label="Close"
          >
            x
          </button>
        </div>

        {mode === "new-place" && (
          <input
            value={placeNameValue}
            disabled={isSaving}
            onChange={(event) => {
              setHasEditedPlaceName(true);
              setPlaceNameDraft(event.target.value);
            }}
            placeholder={
              isResolvingPlaceName
                ? "Finding place..."
                : "Place name (optional)"
            }
            style={inputStyle}
          />
        )}

        <input
          value={title}
          disabled={isSaving}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title (optional)"
          style={inputStyle}
        />

        <textarea
          value={content}
          disabled={isSaving}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write something..."
          style={{
            ...inputStyle,
            minHeight: isMobile ? "140px" : "120px",
            resize: "vertical",
            fontFamily: "inherit",
            lineHeight: 1.45,
          }}
        />

        <select
          value={category}
          disabled={isSaving}
          onChange={(event) => setCategory(event.target.value as NoteCategory)}
          style={inputStyle}
        >
          {noteCategoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          value={eventTime}
          disabled={isSaving}
          onChange={(event) => setEventTime(event.target.value)}
          style={inputStyle}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginTop: "16px",
          }}
        >
          <button
            onClick={onCancel}
            disabled={isSaving}
            style={disabledSecondaryButtonStyle}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            style={saveButtonStyle}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </section>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  minHeight: "46px",
  boxSizing: "border-box",
  marginTop: "12px",
  padding: "11px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#111827",
  fontSize: "16px",
} as const;

const primaryButtonStyle = {
  minHeight: "46px",
  border: "none",
  borderRadius: "8px",
  padding: "10px 14px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
  fontWeight: 650,
} as const;

const secondaryButtonStyle = {
  minHeight: "46px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "10px 14px",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
  fontWeight: 650,
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

export default NoteFormPopup;
