import axios from "axios";

// 创建一个 axios 实例
const http = axios.create({
  baseURL: "https://localhost:44356/api", // 改成你的后端地址
  timeout: 10000,
});

// 请求拦截器：每次请求自动带上 JWT
http.interceptors.request.use((config) => {
  // 从 localStorage 拿 token
  const token = localStorage.getItem("token");

  if (token) {
    // 在请求头里加 Authorization
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

//统一处理 401，自动跳回登录页
http.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default http;