import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { NotePhoto } from "../types/geojson";
import AuthenticatedPhoto from "./AuthenticatedPhoto";

interface Props {
  placeId: number;
  noteId: number;
  photos: NotePhoto[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onClose: () => void;
}

const PhotoLightbox = ({
  placeId,
  noteId,
  photos,
  selectedIndex,
  onSelectIndex,
  onClose,
}: Props) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const selectedPhoto = photos[selectedIndex];
  const hasPrevious = selectedIndex > 0;
  const hasNext = selectedIndex < photos.length - 1;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && hasPrevious) {
        onSelectIndex(selectedIndex - 1);
      } else if (event.key === "ArrowRight" && hasNext) {
        onSelectIndex(selectedIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    hasNext,
    hasPrevious,
    onClose,
    onSelectIndex,
    selectedIndex,
  ]);

  if (!selectedPhoto) {
    return null;
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const distance = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    // Require a deliberate horizontal swipe so normal taps do not change photos.
    if (Math.abs(distance) < 55) return;

    if (distance > 0 && hasPrevious) {
      onSelectIndex(selectedIndex - 1);
    } else if (distance < 0 && hasNext) {
      onSelectIndex(selectedIndex + 1);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      style={overlayStyle}
      onClick={onClose}
    >
      <div style={topBarStyle}>
        <div style={counterStyle}>
          {selectedIndex + 1} / {photos.length}
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close photo viewer"
          title="Close"
          style={iconButtonStyle}
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div
        style={imageAreaStyle}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={handleTouchEnd}
      >
        <AuthenticatedPhoto
          placeId={placeId}
          noteId={noteId}
          photo={selectedPhoto}
          alt={selectedPhoto.fileName || "Memory photo"}
          style={fullPhotoStyle}
        />
      </div>

      {hasPrevious && (
        <button
          type="button"
          aria-label="View previous photo"
          title="Previous photo"
          style={{ ...navigationButtonStyle, left: "12px" }}
          onClick={(event) => {
            event.stopPropagation();
            onSelectIndex(selectedIndex - 1);
          }}
        >
          ‹
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          aria-label="View next photo"
          title="Next photo"
          style={{ ...navigationButtonStyle, right: "12px" }}
          onClick={(event) => {
            event.stopPropagation();
            onSelectIndex(selectedIndex + 1);
          }}
        >
          ›
        </button>
      )}

      <div style={captionStyle}>{selectedPhoto.fileName}</div>
    </div>,
    document.body,
  );
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  display: "grid",
  placeItems: "center",
  padding: "64px clamp(8px, 7vw, 56px) 52px",
  boxSizing: "border-box",
  background: "rgba(3, 7, 18, 0.94)",
  touchAction: "pan-y",
} as const;

const topBarStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  left: 0,
  height: "58px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 12px 8px 18px",
  boxSizing: "border-box",
  color: "#ffffff",
} as const;

const counterStyle = {
  fontSize: "14px",
  fontVariantNumeric: "tabular-nums",
} as const;

const iconButtonStyle = {
  width: "42px",
  height: "42px",
  border: 0,
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.12)",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "28px",
  lineHeight: 1,
} as const;

const imageAreaStyle = {
  width: "100%",
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
} as const;

const fullPhotoStyle = {
  width: "auto",
  height: "auto",
  maxWidth: "100%",
  maxHeight: "100%",
  display: "block",
  objectFit: "contain",
  color: "#d1d5db",
  background: "transparent",
} as const;

const navigationButtonStyle = {
  position: "absolute",
  top: "50%",
  width: "44px",
  height: "52px",
  transform: "translateY(-50%)",
  border: 0,
  borderRadius: "7px",
  background: "rgba(255, 255, 255, 0.13)",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "38px",
  lineHeight: 1,
} as const;

const captionStyle = {
  position: "absolute",
  right: "20px",
  bottom: "16px",
  left: "20px",
  overflow: "hidden",
  color: "#e5e7eb",
  fontSize: "13px",
  textAlign: "center",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

export default PhotoLightbox;
