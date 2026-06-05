import http from "./http";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export const loginApi = async (data: LoginRequest) => {
  const response = await http.post<LoginResponse>("/Auth/Login", data);

  return response.data;
};

export const registerApi = async (data: LoginRequest) => {
  const response = await http.post("/Auth/Register", data);

  return response.data;
};

export const googleLoginApi = async (data: GoogleLoginRequest) => {
  // This API wrapper is ready for the future Google OAuth flow.
  // After Google Client ID is configured, the frontend will send a real Google ID token.
  const response = await http.post<LoginResponse>("/Auth/google", data);

  return response.data;
};
