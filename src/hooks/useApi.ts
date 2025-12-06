import { useState, useCallback } from 'react';
import axios from 'axios';

type AxiosRequestConfig = any;
type AxiosResponse = any;
type AxiosError = any;
import { useAuth } from './useAuth';

// Create axios instance with base URL and common headers
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const useApi = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Add request interceptor to add auth token to requests
  api.interceptors.request.use(
    (config) => {
      const token = user?.token;
      if (token) {
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle common errors
  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response) {
        // Handle 401 Unauthorized
        if (error.response.status === 401) {
          await logout();
          window.location.href = '/login';
        }
        
        // Handle other error statuses
        const errorMessage = error.response.data?.message || 'An error occurred';
        setError(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request
        setError(error.message || 'An error occurred');
      }
      
      return Promise.reject(error);
    }
  );

  // Generic request method
  const request = useCallback(async <T = any>(config: AxiosRequestConfig): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.request(config);
      return response.data as T;
    } catch (err) {
      const error = err as AxiosError;
      setError(error.message || 'An error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Convenience methods for common HTTP methods
  const get = useCallback(<T = any>(url: string, config?: AxiosRequestConfig) => 
    request<T>({ ...config, method: 'get', url })
  , [request]);

  const post = useCallback(<T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'post', url, data })
  , [request]);

  const put = useCallback(<T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'put', url, data })
  , [request]);

  const del = useCallback(<T = any>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'delete', url })
  , [request]);

  const patch = useCallback(<T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'patch', url, data })
  , [request]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    patch,
    // Expose the axios instance for direct use if needed
    axios: api
  };
};

export default useApi;
