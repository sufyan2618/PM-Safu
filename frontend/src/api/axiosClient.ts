import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { ENDPOINTS } from './endpoints';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/** Bare client used for the refresh call so it never triggers the interceptor loop. */
const refreshClient = axios.create({ baseURL: BASE_URL, withCredentials: true });

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

/** Single-flight refresh: concurrent 401s share one refresh request. */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post(ENDPOINTS.auth.refresh)
      .then((res) => {
        const token = res.data?.data?.accessToken as string | undefined;
        if (token) {
          useAuthStore.getState().setToken(token);
          return token;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const NO_REFRESH_PATHS = [
  ENDPOINTS.auth.login,
  ENDPOINTS.auth.register,
  ENDPOINTS.auth.refresh,
  ENDPOINTS.auth.forgotPassword,
  ENDPOINTS.auth.resetPassword,
];

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const shouldRefresh =
      status === 401 &&
      original &&
      !original._retry &&
      !NO_REFRESH_PATHS.some((path) => url.includes(path));

    if (shouldRefresh) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return axiosClient(original);
      }
      // Refresh failed — clear session and bounce to login.
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);
