import { useEffect, useState } from "react";
import { getNotePhotoBlobApi } from "../api/placesApi";
import type { NotePhoto } from "../types/geojson";

interface Props {
  placeId: number;
  noteId: number;
  photo: NotePhoto;
  alt: string;
  style?: React.CSSProperties;
}

const AuthenticatedPhoto = ({
  placeId,
  noteId,
  photo,
  alt,
  style,
}: Props) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    getNotePhotoBlobApi(placeId, noteId, photo.id)
      .then((blob) => {
        if (isCancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setPhotoUrl(objectUrl);
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      isCancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [noteId, photo.id, placeId]);

  if (!photoUrl) {
    return (
      <div
        aria-label={`Loading ${alt}`}
        style={{
          ...style,
          display: "grid",
          placeItems: "center",
          background: "#f3f4f6",
          color: "#9ca3af",
          fontSize: "12px",
        }}
      >
        Loading
      </div>
    );
  }

  return <img src={photoUrl} alt={alt} style={style} />;
};

export default AuthenticatedPhoto;
