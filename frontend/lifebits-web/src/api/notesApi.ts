import http from "./http";

// Note 类型（按你的后端字段改）
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  EventTime: string;
}

// 获取 notes
export const getNotesApi = async () => {
  const response = await http.get<Note[]>("/Notes");

  return response.data;
};