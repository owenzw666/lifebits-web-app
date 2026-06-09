import http from "./http";
import type { PlaceFeatureCollection } from "../types/geojson";

export interface ReverseGeocodeResultDto {
  placeName?: string | null;
}

export interface PlaceSearchResult {
  name: string;
  displayName: string;
  longitude: number;
  latitude: number;
}

export interface MapCenter {
  longitude: number;
  latitude: number;
}

export interface TimelineItem {
  noteId: number;
  placeId: number;
  placeName?: string | null;
  title: string;
  content: string;
  category: string;
  eventTime: string;
  coordinates: [number, number];
}

export interface TimelinePage {
  items: TimelineItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

export interface CreateNoteDto {
  title: string;
  content: string;
  category: string;
  eventTime: string;
}

export interface CreatePlaceWithNoteDto extends CreateNoteDto {
  name?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
}

export const getPlacesMapApi = async () => {
  const response = await http.get<PlaceFeatureCollection>("/places/map");

  return response.data;
};

export const getTimelineApi = async (page = 1, pageSize = 20) => {
  const response = await http.get<TimelinePage>("/places/timeline", {
    params: {
      page,
      pageSize,
    },
  });

  return response.data;
};

export const reverseGeocodePlaceApi = async (lng: number, lat: number) => {
  const response = await http.get<ReverseGeocodeResultDto>(
    "/places/reverse-geocode",
    {
      params: {
        lng,
        lat,
      },
    },
  );

  return response.data;
};

export const searchPlacesApi = async (query: string, mapCenter?: MapCenter) => {
  const response = await http.get<PlaceSearchResult[]>("/places/search", {
    params: {
      query,
      lng: mapCenter?.longitude,
      lat: mapCenter?.latitude,
    },
  });

  return response.data;
};

export const createPlaceWithNoteApi = async (
  data: CreatePlaceWithNoteDto,
) => {
  const response = await http.post("/places", data);

  return response.data;
};

export const createNoteInPlaceApi = async (
  placeId: number,
  data: CreateNoteDto,
) => {
  const response = await http.post(`/places/${placeId}/notes`, data);

  return response.data;
};

export const updatePlaceApi = async (placeId: number, name?: string) => {
  const response = await http.put(`/places/${placeId}`, {
    name,
  });

  return response.data;
};

export const updateNoteInPlaceApi = async (
  placeId: number,
  noteId: number,
  data: CreateNoteDto,
) => {
  const response = await http.put(`/places/${placeId}/notes/${noteId}`, data);

  return response.data;
};

export const deleteNoteInPlaceApi = async (
  placeId: number,
  noteId: number,
) => {
  const response = await http.delete(`/places/${placeId}/notes/${noteId}`);

  return response.data;
};

export const deletePlaceApi = async (placeId: number) => {
  const response = await http.delete(`/places/${placeId}`);

  return response.data;
};
