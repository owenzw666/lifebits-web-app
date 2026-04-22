import http from "./http";

// Note 类型（按你的后端字段改）
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  EventTime: string;
  lng: number;
  lat: number;
}

// 获取 notes
export const getNotesApi = async () => {
  const response = await http.get("/Notes");

  return response.data;
};

// ⭐ 类型定义
export interface CreateNoteDto {
  title: string;
  content: string;
  lat: number;
  lng: number;
  eventTime: string;
}

export const createNoteApi = async (note: CreateNoteDto) => {
  const response = await http.post("/Notes", note);

  // ⭐ 直接返回 value
  return response.data.value;
};
