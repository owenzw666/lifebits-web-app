import { useEffect, useState } from "react";
import { getNotePhotoBlobApi } from "../api/placesApi";
import type { NotePhoto } from "../types/geojson";
import {
  cachePhotoBlob,
  getCachedPhotoBlob,
} from "../utils/photoBlobCache";

interface Props {
  placeId: number;
  noteId: number;
  photo: NotePhoto;
  alt: string;
  style?: React.CSSProperties;
  renderAsBackground?: boolean;
}

const AuthenticatedPhoto = ({
  placeId,
  noteId,
  photo,
  alt,
  style,
  renderAsBackground = false,
}: Props) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | null = null;

    const showBlob = (blob: Blob) => {
      if (isCancelled) return;

      objectUrl = URL.createObjectURL(blob);
      setPhotoUrl(objectUrl);
    };

    const cachedBlob = getCachedPhotoBlob(placeId, noteId, photo.id);
    if (cachedBlob) {
      showBlob(cachedBlob);
    } else {
      getNotePhotoBlobApi(placeId, noteId, photo.id)
        .then((blob) => {
          cachePhotoBlob(placeId, noteId, photo.id, blob);
          showBlob(blob);
        })
        .catch((error) => {
          console.error(error);
        });
    }

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

  if (renderAsBackground) {
    return (
      <div
        role="img"
        aria-label={alt}
        style={{
          ...style,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${photoUrl})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
        }}
      />
    );
  }

  return <img src={photoUrl} alt={alt} style={style} />;
};

export default AuthenticatedPhoto;
