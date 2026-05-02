import { useEffect, useState } from "react";
import { formatDisplayTime, toISO, toLocalInput } from "../utils/time";

const styles = {
  container: {
    width: "240px",
    background: "#fff",
    fontFamily: "system-ui",
    fontSize: "14px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 10px 4px 10px", // ⭐ 留出安全区（避免被圆角裁）
  },

  title: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#444",
  },

  deleteBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "6px",
    transition: "background 0.15s",
  },

  textarea: {
    width: "100%",
    height: "56px",
    border: "none",
    outline: "none",
    resize: "none" as const,
    padding: "6px 10px",
    boxSizing: "border-box" as const,
    fontSize: "14px",
  },

  meta: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    fontSize: "12px",
    color: "#666",
  },

  timeInput: {
    border: "none",
    outline: "none",
    fontSize: "12px",
  },

  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    padding: "8px 10px",
  },

  saveBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "4px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  cancelBtn: {
    background: "#eee",
    border: "none",
    padding: "4px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

interface Props {
  lat: number;
  lng: number;

  initialData?: {
    id?: number;
    title: string;
    content: string;
    eventTime: string;
  };

  onSave: (data: {
    id?: number;
    title: string;
    content: string;
    lat: number;
    lng: number;
    eventTime: string;
  }) => void;
  onCancel: () => void;
  onDelete?: (id: number) => void;
}

const NoteFormPopup = ({
  lat,
  lng,
  initialData,
  onSave,
  onCancel,
  onDelete,
}: Props) => {
  // ⭐ 内容（必填）
  const [content, setContent] = useState(initialData?.content || "");

  // ⭐ 标题（可选）
  const [title, setTitle] = useState(initialData?.title || "");

  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // ⭐ 时间（默认当前）
  const [eventTime, setEventTime] = useState(
    initialData?.eventTime
      ? toLocalInput(initialData.eventTime)
      : toLocalInput(new Date().toISOString()),
  );
  const [noteId, setNoteId] = useState<number | undefined>(initialData?.id);

  useEffect(() => {
    setIsEditingTitle(false);
    if (initialData) {
      console.info("编辑模式");
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      setEventTime(
        initialData.eventTime
          ? toLocalInput(initialData.eventTime)
          : toLocalInput(new Date().toISOString()),
      );
      setNoteId(initialData?.id);
    } else {
      console.info("新增模式");
      // 新增模式
      setTitle("");
      setContent("");
      setEventTime(toLocalInput(new Date().toISOString()));
    }
  }, [initialData]);

  console.info(initialData);

  const handleSubmit = () => {
    if (!content.trim()) {
      alert("内容不能为空");
      return;
    }

    const finalTitle = title.trim(); // 如果没输入标题，保存空字符串，显示的时候再按照时间显示。

    console.info(noteId);

    onSave({
      id: noteId,
      title: finalTitle,
      content,
      lat,
      lng,
      eventTime: toISO(eventTime),
    });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title} title="Click to edit title">
          {isEditingTitle ? (
            <input
              value={title}
              autoFocus
              placeholder="Title (optional)"
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsEditingTitle(false);
                }
              }}
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: "13px",
                fontWeight: 500,
                background: "transparent",
                color: title ? "#444" : "#999",
              }}
            />
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              style={{ cursor: "text" }}
              title="Click to edit title"
            >
              {title || formatDisplayTime(toISO(eventTime))}
            </div>
          )}
        </div>

        {initialData?.id && (
          <button
            onClick={() => onDelete?.(initialData.id!)}
            style={styles.deleteBtn}
            title="Delete"
          >
            🗑
          </button>
        )}
      </div>

      {/* Body */}
      <textarea
        placeholder="Write something..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={styles.textarea}
      />

      {/* Meta */}
      <div style={styles.meta}>
        <span>📅</span>
        <input
          type="datetime-local"
          value={eventTime}
          onChange={(e) => setEventTime(e.target.value)}
          style={styles.timeInput}
        />
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button onClick={onCancel} style={styles.cancelBtn}>
          Cancel
        </button>
        <button onClick={handleSubmit} style={styles.saveBtn}>
          Save
        </button>
      </div>
    </div>
  );
};

export default NoteFormPopup;
