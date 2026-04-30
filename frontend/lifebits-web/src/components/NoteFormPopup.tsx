import { useEffect, useState } from "react";

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
    padding: "8px 10px 4px 10px",  // ⭐ 留出安全区（避免被圆角裁）
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

  // ⭐ 时间（默认当前）
  const [eventTime, setEventTime] = useState(
    initialData
      ? initialData.eventTime.slice(0, 16)
      : new Date().toISOString().slice(0, 16),
  );
  const [noteId, setNoteId] = useState<number | undefined>(initialData?.id);

  useEffect(() => {
    if (initialData) {
      console.info("编辑模式");
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      setEventTime(
        initialData.eventTime
          ? initialData.eventTime.slice(0, 16)
          : new Date().toISOString().slice(0, 16),
      );
      setNoteId(initialData?.id);
    } else {
      console.info("新增模式");
      // 新增模式
      setTitle("");
      setContent("");
      setEventTime(new Date().toISOString().slice(0, 16));
    }
  }, [initialData]);

  console.info(initialData);

  const handleSubmit = () => {
    if (!content.trim()) {
      alert("内容不能为空");
      return;
    }

    const finalTitle = title.trim() || new Date(eventTime).toLocaleString(); // ⭐ 默认用时间

    console.info(noteId);

    onSave({
      id: noteId,
      title: finalTitle,
      content,
      lat,
      lng,
      eventTime: new Date(eventTime).toISOString(),
    });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          {title || new Date(eventTime).toLocaleString()}
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
