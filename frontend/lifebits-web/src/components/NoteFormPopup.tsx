import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  photos?: File[];
}

interface Props {
  mode: "new-place" | "existing-place" | "edit-note";
  isMobile: boolean;
  initialValues?: NoteFormValues;
  isResolvingPlaceName?: boolean;
  isSaving: boolean;
  savingLabel?: string;
  onSave: (values: NoteFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const NoteFormPopup = ({
  mode,
  isMobile,
  initialValues,
  isResolvingPlaceName = false,
  isSaving,
  savingLabel = "Saving...",
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
  const [initialEventTime] = useState(() =>
    initialValues?.eventTime
      ? toLocalInput(initialValues.eventTime)
      : toLocalInput(new Date().toISOString()),
  );
  const [eventTime, setEventTime] = useState(initialEventTime);
  const [photos, setPhotos] = useState<File[]>(initialValues?.photos ?? []);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const placeNameValue = hasEditedPlaceName
    ? placeNameDraft
    : (initialValues?.placeName ?? "");

  const isDirty =
    hasEditedPlaceName ||
    title !== (initialValues?.title ?? "") ||
    content !== (initialValues?.content ?? "") ||
    category !== (initialValues?.category ?? defaultNoteCategory) ||
    eventTime !== initialEventTime ||
    photos.length > 0;

  const requestClose = useCallback(() => {
    if (isSaving) return;

    if (isDirty && !window.confirm("Discard unsaved changes?")) {
      return;
    }

    onCancel();
  }, [isDirty, isSaving, onCancel]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      requestClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

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
      photos,
    });
  };

  const addPhotos = (selectedFiles: File[]) => {
    const supportedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ]);
    const validFiles = selectedFiles.filter(
      (file) => supportedTypes.has(file.type) && file.size <= 8 * 1024 * 1024,
    );

    const remainingSlots = 5 - photos.length;

    if (validFiles.length > remainingSlots) {
      setPhotoError("A note can contain up to 5 photos.");
    } else if (validFiles.length !== selectedFiles.length) {
      setPhotoError("Use JPEG, PNG, WebP or AVIF files up to 8 MB each.");
    } else {
      setPhotoError(null);
    }

    setPhotos((current) => [...current, ...validFiles].slice(0, 5));
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
        role="dialog"
        aria-modal="true"
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
            onClick={requestClose}
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

        <section aria-label="Photos" style={photoSectionStyle}>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            hidden
            onChange={(event) => {
              addPhotos(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />

          <div style={photoHeaderStyle}>
            <div>
              <strong style={{ display: "block", fontSize: "14px" }}>
                Photos
              </strong>
              <span style={photoHintStyle}>
                {photos.length === 0
                  ? "Optional, up to 5"
                  : `${photos.length} of 5 selected`}
              </span>
            </div>
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isSaving}
                style={{
                  ...addPhotoButtonStyle,
                  opacity: isSaving ? 0.65 : 1,
                  cursor: isSaving ? "not-allowed" : "pointer",
                }}
              >
                + Add photos
              </button>
            )}
          </div>

          {photos.length > 0 && (
            <div style={photoPreviewRowStyle}>
              {photos.map((file, index) => (
                <PendingPhotoPreview
                  key={`${file.name}-${file.lastModified}-${index}`}
                  file={file}
                  index={index}
                  disabled={isSaving}
                  onRemove={() => {
                    setPhotos((current) =>
                      current.filter((_, photoIndex) => photoIndex !== index),
                    );
                    setPhotoError(null);
                  }}
                />
              ))}
            </div>
          )}

          {photoError && (
            <div role="alert" style={photoErrorStyle}>
              {photoError}
            </div>
          )}
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginTop: "16px",
          }}
        >
          <button
            onClick={requestClose}
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
            {isSaving ? savingLabel : "Save"}
          </button>
        </div>
      </section>
    </div>
  );
};

const PendingPhotoPreview = ({
  file,
  index,
  disabled,
  onRemove,
}: {
  file: File;
  index: number;
  disabled: boolean;
  onRemove: () => void;
}) => {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <div style={photoPreviewFrameStyle}>
      {previewUrl && (
        <img
          src={previewUrl}
          alt={`Selected photo ${index + 1}`}
          style={photoPreviewImageStyle}
        />
      )}
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        title="Remove photo"
        disabled={disabled}
        onClick={onRemove}
        style={{
          ...removePhotoButtonStyle,
          opacity: disabled ? 0.65 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        x
      </button>
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

const photoSectionStyle = {
  marginTop: "12px",
  padding: "11px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  background: "#f9fafb",
} as const;

const photoHeaderStyle = {
  minHeight: "38px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
} as const;

const photoHintStyle = {
  display: "block",
  marginTop: "2px",
  color: "#6b7280",
  fontSize: "12px",
} as const;

const addPhotoButtonStyle = {
  flex: "0 0 auto",
  minHeight: "36px",
  padding: "7px 10px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#374151",
  fontSize: "13px",
  fontWeight: 650,
} as const;

const photoPreviewRowStyle = {
  display: "flex",
  gap: "8px",
  marginTop: "10px",
  paddingBottom: "2px",
  overflowX: "auto",
  overscrollBehaviorX: "contain",
} as const;

const photoPreviewFrameStyle = {
  position: "relative",
  width: "72px",
  height: "58px",
  flex: "0 0 72px",
  overflow: "hidden",
  borderRadius: "7px",
  background: "#e5e7eb",
} as const;

const photoPreviewImageStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "contain",
} as const;

const removePhotoButtonStyle = {
  position: "absolute",
  top: "4px",
  right: "4px",
  width: "24px",
  height: "24px",
  padding: 0,
  border: "1px solid rgba(255, 255, 255, 0.7)",
  borderRadius: "50%",
  background: "rgba(17, 24, 39, 0.82)",
  color: "#ffffff",
  fontSize: "14px",
  lineHeight: 1,
} as const;

const photoErrorStyle = {
  marginTop: "8px",
  color: "#b91c1c",
  fontSize: "12px",
  lineHeight: 1.4,
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
