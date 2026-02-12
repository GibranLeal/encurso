import axios from "axios";

export const http = axios.create({
  baseURL: "http://localhost:4000",
});

// Interceptor: añade token automático
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("encurso_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
