/// <reference types="vite/client" />
import axios, { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
    const token = storage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const storage = localStorage.getItem('refresh_token') ? localStorage : sessionStorage;
      const refreshToken = storage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Attempt to refresh the token
          const response = await axios.post(`${apiClient.defaults.baseURL}/api/v1/auth/refresh/`, {
            refresh: refreshToken,
          });

          // Save the new access token
          storage.setItem('access_token', response.data.access);

          // Retry the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout the user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('rbac-session');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          sessionStorage.removeItem('rbac-session');
          window.location.href = '/login';
          // You might want to redirect to login page here or emit an event
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
