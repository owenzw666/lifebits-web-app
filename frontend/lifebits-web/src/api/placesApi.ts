import http from "./http";
import type { PlaceFeatureCollection } from "../types/geojson";

export interface CreateNoteDto {
  title: string;
  content: string;
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
