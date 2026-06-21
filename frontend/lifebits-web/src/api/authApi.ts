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

export const refreshSessionApi = async () => {
  const response = await http.post<LoginResponse>("/Auth/refresh");

  return response.data;
};

export const logoutApi = async () => {
  await http.post("/Auth/logout");
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
  // The backend validates this token with Google before creating a Lifebits session.
  const response = await http.post<LoginResponse>("/Auth/google", data);

  return response.data;
};
