import axios from "axios";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  exp: number;
  [key: string]: any;
}

class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {}

  static getInstance(): TokenManager {
    if (!this.instance) {
      this.instance = new TokenManager();
    }
    return this.instance;
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem("access_token");
  }

  setAccessToken(token: string): void {
    sessionStorage.setItem("access_token", token);
  }

  removeAccessToken(): void {
    sessionStorage.removeItem("access_token");
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/refresh_token`,
        );
        const newAccessToken = response.data.access_token;

        this.setAccessToken(newAccessToken);
        resolve(newAccessToken);
      } catch (error) {
        this.removeAccessToken();
        sessionStorage.clear();
        window.location.href = "/";
        reject(error);
      } finally {
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }
}

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

const tokenManager = TokenManager.getInstance();

axiosInstance.interceptors.request.use(
  async (config) => {
    if (["/auth/login", "/auth/signup", "/lecture_connect"].includes(config.url || "")) {
      return config;
    }
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      !["/auth/login", "/auth/signup", "/lecture_connect"].includes(originalRequest.url || "") &&
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await tokenManager.refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
