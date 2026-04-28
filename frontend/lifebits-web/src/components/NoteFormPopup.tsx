import { useEffect, useState } from "react";

const styles:{[key: string]: React.CSSProperties} = {
  container: {
    width: "240px",
    boxSizing: "border-box",
    fontSize: "14px",
    fontFamily: "system-ui",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },

  title: {
    fontWeight: 500,
    fontSize: "13px",
    color: "#444",
  },

  actions: {
    display: "flex",
    gap: "6px",
  },

  textarea: {
    width: "100%",
    height: "50px",
    border: "none",
    outline: "none",
    resize: "none" as const,
    marginBottom: "6px",
    fontSize: "14px",
  },

  timeRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#666",
    marginBottom: "8px",
  },

  timeInput: {
    border: "none",
    outline: "none",
    fontSize: "12px",
  },

  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "6px",
  },

  saveBtn: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
  },

  cancelBtn: {
    background: "#eee",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
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

        <div style={styles.actions}>
          {initialData?.id && (
            <button
              onClick={() => onDelete?.(initialData.id!)}
              style={{ color: "red" }}
            >
              🗑
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <textarea
        placeholder="Write something..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={styles.textarea}
      />

      {/* Time */}
      <div style={styles.timeRow}>
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
        <button onClick={handleSubmit} style={styles.saveBtn}>
          Save
        </button>
        <button onClick={onCancel} style={styles.cancelBtn}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default NoteFormPopup;
