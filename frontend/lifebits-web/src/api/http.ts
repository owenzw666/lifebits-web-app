import axios from "axios";

// Vite exposes env variables through import.meta.env.
// The fallback matches the backend's IIS Express HTTPS profile in Visual Studio.
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? "https://localhost:44356/api";

const http = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    // Attach JWT automatically after login.
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(err);
  },
);

export default http;
