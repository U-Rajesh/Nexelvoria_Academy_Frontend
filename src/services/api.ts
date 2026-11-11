import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '../constants/appConfig';

/**
 * Standard API client configured for future backend integration.
 * In development / mock mode, service calls can either invoke mock data
 * or make Axios requests if VITE_API_URL is configured.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized redirect if required
      console.warn('Unauthorized API call detected');
    }
    return Promise.reject(error);
  }
);

