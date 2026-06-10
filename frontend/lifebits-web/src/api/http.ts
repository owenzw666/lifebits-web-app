import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  AUTH_EXPIRED_EVENT,
  getAccessToken,
  isTokenExpired,
  setAccessToken,
} from "../utils/authToken";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL environment variable");
}

const webClientHeaders = {
  "X-Lifebits-Client": "LifebitsWeb",
};

const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  withCredentials: true,
  headers: webClientHeaders,
});

interface RefreshResponse {
  token: string;
}

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

const notifyAuthExpired = () => {
  setAccessToken(null);
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const refreshAccessToken = () => {
  if (!refreshPromise) {
    // Use the base Axios client so a failed refresh cannot recursively invoke
    // this response interceptor.
    refreshPromise = axios
      .post<RefreshResponse>(
        `${apiBaseUrl}/Auth/refresh`,
        {},
        {
          timeout: 10000,
          withCredentials: true,
          headers: webClientHeaders,
        },
      )
      .then((response) => {
        setAccessToken(response.data.token);
        return response.data.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

http.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token && !isTokenExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    const isAuthEndpoint =
      typeof originalRequest?.url === "string" &&
      originalRequest.url.toLowerCase().includes("/auth/");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const token = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return await http(originalRequest);
      } catch {
        notifyAuthExpired();
      }
    }

    return Promise.reject(error);
  },
);

export default http;

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  if (error.response?.status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }

  const responseData = error.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    "errors" in responseData &&
    responseData.errors &&
    typeof responseData.errors === "object"
  ) {
    const firstMessages = Object.values(responseData.errors).find(
      (messages) => Array.isArray(messages) && messages.length > 0,
    );

    if (
      Array.isArray(firstMessages) &&
      typeof firstMessages[0] === "string"
    ) {
      return firstMessages[0];
    }
  }

  if (
    responseData &&
    typeof responseData === "object" &&
    "title" in responseData &&
    typeof responseData.title === "string"
  ) {
    return responseData.title;
  }

  if (error.code === "ECONNABORTED") {
    return "The request took too long. Please try again.";
  }

  if (!error.response) {
    return "Could not connect to Lifebits. Please check your connection.";
  }

  return fallbackMessage;
};
