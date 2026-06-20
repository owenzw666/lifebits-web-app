import type { TimelineItem } from "../api/placesApi";
import { getNoteCategoryOption } from "../utils/noteCategories";
import { formatDisplayTime } from "../utils/time";
import AuthenticatedPhoto from "./AuthenticatedPhoto";

interface Props {
  items: TimelineItem[];
  totalCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onSelectItem: (item: TimelineItem) => void;
  onLoadMore: () => void;
}

const TimelineList = ({
  items,
  totalCount,
  isLoading,
  isLoadingMore,
  hasMore,
  onSelectItem,
  onLoadMore,
}: Props) => {
  if (isLoading && items.length === 0) {
    return <div style={messageStyle}>Loading memories...</div>;
  }

  if (items.length === 0) {
    return (
      <div style={messageStyle}>
        Your memories will appear here after you create a note.
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 12px 18px" }}>
      <div style={summaryStyle}>
        {totalCount} {totalCount === 1 ? "memory" : "memories"}
      </div>

      {items.map((item) => {
        const category = getNoteCategoryOption(item.category);
        const placeName = item.placeName || `Place #${item.placeId}`;

        return (
          <button
            key={item.noteId}
            type="button"
            onClick={() => onSelectItem(item)}
            style={timelineItemStyle}
          >
            <div style={timeStyle}>{formatDisplayTime(item.eventTime)}</div>

            <div style={titleRowStyle}>
              <strong style={titleStyle}>
                {item.title || "Untitled memory"}
              </strong>
              <span
                style={{
                  ...categoryStyle,
                  borderColor: category.border,
                  background: category.background,
                  color: category.color,
                }}
              >
                {category.label}
              </span>
            </div>

            <div style={placeStyle}>{placeName}</div>
            <div style={contentStyle}>{item.content}</div>

            {item.photos?.[0] && (
              <AuthenticatedPhoto
                placeId={item.placeId}
                noteId={item.noteId}
                photo={item.photos[0]}
                alt={item.photos[0].fileName || "Memory photo"}
                style={timelinePhotoStyle}
              />
            )}
          </button>
        );
      })}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          style={{
            ...loadMoreStyle,
            cursor: isLoadingMore ? "wait" : "pointer",
            opacity: isLoadingMore ? 0.7 : 1,
          }}
        >
          {isLoadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
};

const messageStyle = {
  padding: "24px 16px",
  color: "#6b7280",
  lineHeight: 1.5,
} as const;

const summaryStyle = {
  padding: "4px 2px 10px",
  color: "#6b7280",
  fontSize: "12px",
} as const;

const timelineItemStyle = {
  display: "block",
  width: "100%",
  minHeight: "118px",
  marginBottom: "10px",
  padding: "13px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#111827",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
  cursor: "pointer",
  textAlign: "left",
} as const;

const timeStyle = {
  color: "#6b7280",
  fontSize: "12px",
} as const;

const titleRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginTop: "6px",
} as const;

const titleStyle = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "15px",
} as const;

const categoryStyle = {
  flex: "0 0 auto",
  maxWidth: "100px",
  padding: "3px 7px",
  border: "1px solid",
  borderRadius: "999px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "11px",
  fontWeight: 700,
} as const;

const placeStyle = {
  marginTop: "6px",
  color: "#2563eb",
  fontSize: "13px",
  fontWeight: 650,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const contentStyle = {
  display: "-webkit-box",
  marginTop: "8px",
  overflow: "hidden",
  color: "#4b5563",
  fontSize: "13px",
  lineHeight: 1.45,
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
} as const;

const timelinePhotoStyle = {
  width: "100%",
  aspectRatio: "16 / 9",
  display: "block",
  marginTop: "10px",
  borderRadius: "7px",
  objectFit: "contain",
} as const;

const loadMoreStyle = {
  width: "100%",
  minHeight: "44px",
  marginTop: "4px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#374151",
  fontWeight: 650,
} as const;

export default TimelineList;
