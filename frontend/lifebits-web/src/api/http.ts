import axios from "axios";
import {
  AUTH_EXPIRED_EVENT,
  clearStoredToken,
  getStoredToken,
  isTokenExpired,
} from "../utils/authToken";

// Vite exposes env variables through import.meta.env.
// The fallback matches the backend's IIS Express HTTPS profile in Visual Studio.
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "https://localhost:44356/api";

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
