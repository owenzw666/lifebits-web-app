import http from "./http";

// Note 类型（按你的后端字段改）
export interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  eventTime: string;
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

export const updateNoteApi = async (
  id:number,
  note:{
    title:string,
    content:string,
    lat: number,
    lng: number,
    eventTime: string
  }
)=>{
    const res= await http.put(`/Notes/${id}`,note);
    return res.data;
}
