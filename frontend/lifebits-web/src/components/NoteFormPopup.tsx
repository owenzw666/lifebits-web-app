import { useState } from "react";
import { toISO, toLocalInput } from "../utils/time";

export interface NoteFormValues {
  title: string;
  content: string;
  eventTime: string;
  placeName?: string;
}

interface Props {
  mode: "new-place" | "existing-place";
  onSave: (values: NoteFormValues) => void;
  onCancel: () => void;
}

const NoteFormPopup = ({ mode, onSave, onCancel }: Props) => {
  const [placeName, setPlaceName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [eventTime, setEventTime] = useState(toLocalInput(new Date().toISOString()));

  const handleSubmit = () => {
    if (!content.trim()) {
      alert("Content is required");
      return;
    }

    const isoTime = toISO(eventTime);

    onSave({
      title: title.trim(),
      content: content.trim(),
      eventTime: isoTime,
      placeName: placeName.trim() || undefined,
    });
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.38)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(420px, calc(100vw - 32px))",
          padding: "18px",
          borderRadius: "10px",
          background: "#ffffff",
          color: "#111827",
          boxShadow: "0 20px 45px rgba(15, 23, 42, 0.24)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "18px" }}>
          {mode === "new-place" ? "New place note" : "Add note here"}
        </h2>

        {mode === "new-place" && (
          <input
            value={placeName}
            onChange={(event) => setPlaceName(event.target.value)}
            placeholder="Place name (optional)"
            style={inputStyle}
          />
        )}

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title (optional)"
          style={inputStyle}
        />

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write something..."
          style={{
            ...inputStyle,
            minHeight: "110px",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />

        <input
          type="datetime-local"
          value={eventTime}
          onChange={(event) => setEventTime(event.target.value)}
          style={inputStyle}
        />

        {/* Footer actions keep cancel and save in one predictable place. */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "14px",
          }}
        >
          <button onClick={onCancel} style={secondaryButtonStyle}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={primaryButtonStyle}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: "12px",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#111827",
  fontSize: "14px",
} as const;

const primaryButtonStyle = {
  border: "none",
  borderRadius: "8px",
  padding: "8px 14px",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
} as const;

const secondaryButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  padding: "8px 14px",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
} as const;

export default NoteFormPopup;
