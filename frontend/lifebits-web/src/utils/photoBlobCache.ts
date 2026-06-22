const MAX_CACHED_PHOTOS = 40;

const photoBlobCache = new Map<string, Blob>();

const getCacheKey = (placeId: number, noteId: number, photoId: number) =>
  `${placeId}:${noteId}:${photoId}`;

export const getCachedPhotoBlob = (
  placeId: number,
  noteId: number,
  photoId: number,
) => photoBlobCache.get(getCacheKey(placeId, noteId, photoId));

export const cachePhotoBlob = (
  placeId: number,
  noteId: number,
  photoId: number,
  blob: Blob,
) => {
  const key = getCacheKey(placeId, noteId, photoId);

  // Refresh the insertion order so recently used photos remain in the cache.
  photoBlobCache.delete(key);
  photoBlobCache.set(key, blob);

  if (photoBlobCache.size > MAX_CACHED_PHOTOS) {
    const oldestKey = photoBlobCache.keys().next().value;
    if (oldestKey) photoBlobCache.delete(oldestKey);
  }
};

export const removeCachedPhotoBlob = (
  placeId: number,
  noteId: number,
  photoId: number,
) => {
  photoBlobCache.delete(getCacheKey(placeId, noteId, photoId));
};
