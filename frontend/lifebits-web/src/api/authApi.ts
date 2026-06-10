import http from "./http";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  isEmailVerified: boolean;
}

export interface AccountActionResponse {
  message: string;
  developmentLink?: string | null;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export const loginApi = async (data: LoginRequest) => {
  const response = await http.post<LoginResponse>("/Auth/Login", data);

  return response.data;
};

export const registerApi = async (data: LoginRequest) => {
  const response = await http.post<AccountActionResponse>(
    "/Auth/Register",
    data,
  );

  return response.data;
};

export const verifyEmailApi = async (token: string) => {
  const response = await http.post<AccountActionResponse>(
    "/Auth/verify-email",
    { token },
  );

  return response.data;
};

export const resendVerificationApi = async (email: string) => {
  const response = await http.post<AccountActionResponse>(
    "/Auth/resend-verification",
    { email },
  );

  return response.data;
};

export const forgotPasswordApi = async (email: string) => {
  const response = await http.post<AccountActionResponse>(
    "/Auth/forgot-password",
    { email },
  );

  return response.data;
};

export const resetPasswordApi = async (
  token: string,
  newPassword: string,
) => {
  const response = await http.post<AccountActionResponse>(
    "/Auth/reset-password",
    {
      token,
      newPassword,
    },
  );

  return response.data;
};

export const googleLoginApi = async (data: GoogleLoginRequest) => {
  // This API wrapper is ready for the future Google OAuth flow.
  // After Google Client ID is configured, the frontend will send a real Google ID token.
  const response = await http.post<LoginResponse>("/Auth/google", data);

  return response.data;
};
