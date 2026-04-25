import http from "./http";

// 登录请求参数类型
export interface LoginRequest {
  email: string;
  password: string;
}

// 登录返回结果类型
export interface LoginResponse {
  token: string;
}

export const loginApi = async (data: LoginRequest) => {
  // 调用后端 login API
  const response = await http.post<LoginResponse>("/Auth/Login", data);

  return response.data;
};

export const registerApi = async (data: LoginRequest) => {
  const response = await http.post("/Auth/Register", data);
  return response.data;
};