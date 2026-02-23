import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import { useEffect, useRef } from "react";

// API URL from environment variable (set in .env)
// Default fallback for development
// const API_URL = "http://192.168.18.29:3000/api";

// API URL for production
const API_URL = "https://mobile-app-growliv-zm3uu.sevalla.app/api";

// Create axios instance ONCE outside the hook
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const useApi = () => {
  const { getToken } = useAuth();
  const interceptorId = useRef<number | null>(null);

  useEffect(() => {
    // Remove previous interceptor if exists
    if (interceptorId.current !== null) {
      api.interceptors.request.eject(interceptorId.current);
    }

    // Add new interceptor with current getToken reference
    interceptorId.current = api.interceptors.request.use(
      async (config) => {
        try {
          const token = await getToken();

          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error("Failed to get token:", error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Cleanup on unmount or when getToken changes
    return () => {
      if (interceptorId.current !== null) {
        api.interceptors.request.eject(interceptorId.current);
      }
    };
  }, [getToken]);

  return api;
};
