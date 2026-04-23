import { useEffect, useState } from "react";

const styles = {
  container: {
    position: "absolute" as const,
    top: "20px",
    left: "20px",
    background: "#fff",
    padding: "12px",
    borderRadius: "8px",
    width: "250px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    zIndex: 1000,
  },
  input: {
    width: "100%",
    marginBottom: "8px",
  },
  textarea: {
    width: "100%",
    height: "60px",
    marginBottom: "8px",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
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
}

const NoteFormPopup = ({ lat, lng, initialData, onSave, onCancel }: Props) => {
  // ⭐ 内容（必填）
  const [content, setContent] = useState(initialData?.content||"");

  // ⭐ 标题（可选）
  const [title, setTitle] = useState(initialData?.title||"");

  // ⭐ 时间（默认当前）
  const [eventTime, setEventTime] = useState(
    initialData?initialData.eventTime.slice(0, 16):
    new Date().toISOString().slice(0, 16),
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
      <h4>Add new note</h4>

      {/* 标题（可选） */}
      <input
        placeholder="Title(Optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={styles.input}
      />

      {/* 内容（必填） */}
      <textarea
        placeholder="Input content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={styles.textarea}
      />

      {/* 时间 */}
      <input
        type="datetime-local"
        value={eventTime}
        onChange={(e) => setEventTime(e.target.value)}
        style={styles.input}
      />

      <div style={styles.actions}>
        <button onClick={handleSubmit}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

export default NoteFormPopup;
