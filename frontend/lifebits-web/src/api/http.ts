import axios from "axios";
import {
  AUTH_EXPIRED_EVENT,
  clearStoredToken,
  getStoredToken,
  isTokenExpired,
} from "../utils/authToken";

// Vite exposes frontend environment variables through import.meta.env.
// Configure VITE_API_BASE_URL in .env.development or .env.production.
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL environment variable");
}

const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

const notifyAuthExpired = () => {
  clearStoredToken();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

http.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (!token) return config;

  if (isTokenExpired(token)) {
    notifyAuthExpired();
    return Promise.reject(new Error("Session expired"));
  }

  config.headers.Authorization = `Bearer ${token}`;

  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      notifyAuthExpired();
    }

    return Promise.reject(err);
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
