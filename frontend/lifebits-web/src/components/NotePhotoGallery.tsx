import { useRef, useState } from "react";
import type { NotePhoto } from "../types/geojson";
import AuthenticatedPhoto from "./AuthenticatedPhoto";
import PhotoLightbox from "./PhotoLightbox";

interface Props {
  placeId: number;
  noteId: number;
  photos: NotePhoto[];
  isUploading: boolean;
  deletingPhotoId: number | null;
  onUpload: (file: File) => void;
  onDelete: (photo: NotePhoto) => void;
}

const NotePhotoGallery = ({
  placeId,
  noteId,
  photos,
  isUploading,
  deletingPhotoId,
  onUpload,
  onDelete,
}: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(
    null,
  );
  const canAddPhoto = photos.length < 5;
  const selectedPhotoIndex = photos.findIndex(
    (photo) => photo.id === selectedPhotoId,
  );

  return (
    <>
      <section aria-label="Note photos" style={{ marginTop: "18px" }}>
        <div style={headerStyle}>
          <strong style={{ fontSize: "14px" }}>
            Photos {photos.length > 0 ? `(${photos.length}/5)` : ""}
          </strong>
          {canAddPhoto && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              style={{
                ...addButtonStyle,
                cursor: isUploading ? "wait" : "pointer",
                opacity: isUploading ? 0.7 : 1,
              }}
            >
              {isUploading ? "Uploading..." : "Add photo"}
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (file) {
              onUpload(file);
            }
          }}
        />

        {photos.length === 0 ? (
          <div style={emptyStyle}>
            Add a photo to make this memory more vivid.
          </div>
        ) : (
          <div style={gridStyle}>
            {photos.map((photo) => {
              const isDeleting = deletingPhotoId === photo.id;

              return (
                <div key={photo.id} style={photoFrameStyle}>
                  <button
                    type="button"
                    aria-label={`View ${photo.fileName || "photo"}`}
                    onClick={() => setSelectedPhotoId(photo.id)}
                    style={photoButtonStyle}
                  >
                    <AuthenticatedPhoto
                      placeId={placeId}
                      noteId={noteId}
                      photo={photo}
                      alt={photo.fileName || "Memory photo"}
                      style={photoStyle}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${photo.fileName || "photo"}`}
                    title="Delete photo"
                    onClick={() => onDelete(photo)}
                    disabled={isDeleting}
                    style={{
                      ...deleteButtonStyle,
                      cursor: isDeleting ? "wait" : "pointer",
                      opacity: isDeleting ? 0.7 : 1,
                    }}
                  >
                    {isDeleting ? "..." : "×"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={hintStyle}>JPEG, PNG or WebP. Up to 8 MB each.</div>
      </section>

      {selectedPhotoIndex >= 0 && (
        <PhotoLightbox
          placeId={placeId}
          noteId={noteId}
          photos={photos}
          selectedIndex={selectedPhotoIndex}
          onSelectIndex={(index) => setSelectedPhotoId(photos[index].id)}
          onClose={() => setSelectedPhotoId(null)}
        />
      )}
    </>
  );
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
} as const;

const addButtonStyle = {
  minHeight: "36px",
  padding: "7px 11px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  background: "#ffffff",
  color: "#374151",
  fontWeight: 650,
} as const;

const emptyStyle = {
  marginTop: "10px",
  padding: "14px",
  border: "1px dashed #d1d5db",
  borderRadius: "8px",
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: 1.45,
} as const;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "8px",
  marginTop: "10px",
} as const;

const photoFrameStyle = {
  position: "relative",
  aspectRatio: "4 / 3",
  overflow: "hidden",
  borderRadius: "8px",
  background: "#f3f4f6",
} as const;

const photoStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "contain",
} as const;

const photoButtonStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  padding: 0,
  border: 0,
  background: "transparent",
  cursor: "zoom-in",
} as const;

const deleteButtonStyle = {
  position: "absolute",
  top: "6px",
  right: "6px",
  width: "30px",
  height: "30px",
  border: "1px solid rgba(255, 255, 255, 0.65)",
  borderRadius: "50%",
  background: "rgba(17, 24, 39, 0.82)",
  color: "#ffffff",
  fontSize: "16px",
  lineHeight: 1,
} as const;

const hintStyle = {
  marginTop: "8px",
  color: "#9ca3af",
  fontSize: "11px",
} as const;

export default NotePhotoGallery;
