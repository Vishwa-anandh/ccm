import axios from "axios";
import { fireToast } from "../components/ToastProvider";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/admin",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sa_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      fireToast("Cannot reach the server. Check your connection.", "offline");
      throw error;
    }

    const status = error.response.status;
    const serverMsg = error.response.data?.error;

    if (status === 401) {
      localStorage.removeItem("sa_token");
      globalThis.location.href = "/admin/login";
      throw error;
    }
    if (status === 429) {
      fireToast(
        serverMsg || "Too many requests — please wait and try again.",
        "warning",
      );
    } else if (status >= 500) {
      fireToast(
        "An unexpected server error occurred. Please try again.",
        "error",
      );
    }

    throw error;
  },
);

export default api;
