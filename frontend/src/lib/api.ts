"use client";

import axios, {
    type AxiosInstance,
    type InternalAxiosRequestConfig,
    type AxiosError,
} from "axios";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    },
);

// Response interceptor - handle token refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (typeof window !== "undefined") {
                const refreshToken = localStorage.getItem("refreshToken");
                if (refreshToken) {
                    try {
                        const response = await axios.post(
                            `${API_BASE_URL}/api/auth/token/refresh/`,
                            {
                                refresh: refreshToken,
                            },
                        );

                        const { access } = response.data;
                        localStorage.setItem("accessToken", access);

                        // Retry original request with new token
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${access}`;
                        }
                        return api(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed - clear tokens and redirect to login
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        window.location.href = "/login";
                        return Promise.reject(refreshError);
                    }
                } else {
                    // No refresh token - redirect to login
                    window.location.href = "/login";
                }
            }
        }

        return Promise.reject(error);
    },
);

export default api;
