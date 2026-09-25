import axios from 'axios';
import { supabase } from '../lib/supabase';
import type { HealthResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

// Interceptor to attach Bearer JWT access token from Supabase Auth session or dev operator token
apiClient.interceptors.request.use(
  async (config) => {
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
          return config;
        }
      } catch (err) {
        // Fallback to dev operator token
      }
    }
    if (!config.headers.Authorization) {
      config.headers.Authorization = 'Bearer dev-operator-token';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.detail ||
      error.message ||
      'API request failed. Please check network connection.';
    return Promise.reject(new Error(message));
  }
);

export const checkBackendHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
};
