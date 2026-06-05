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
