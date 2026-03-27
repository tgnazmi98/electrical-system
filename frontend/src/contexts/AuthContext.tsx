"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import api from "@/lib/api";
import type { User, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = useCallback(async () => {
        if (typeof window === "undefined") {
            setLoading(false);
            return;
        }

        const token = localStorage.getItem("accessToken");
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get<User>("/api/auth/user/");
            setUser(response.data);
            setError(null);
        } catch (err: unknown) {
            console.error("Error fetching user:", err);
            const axiosError = err as { response?: { status: number } };
            // Token might be invalid, clear it
            if (axiosError.response?.status === 401) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (
        username: string,
        password: string,
    ): Promise<boolean> => {
        setError(null);
        try {
            const response = await api.post<{
                access: string;
                refresh: string;
            }>("/api/auth/token/", {
                username,
                password,
            });

            const { access, refresh } = response.data;
            localStorage.setItem("accessToken", access);
            localStorage.setItem("refreshToken", refresh);

            // Fetch user info
            await fetchUser();
            return true;
        } catch (err: unknown) {
            console.error("Login error:", err);
            const axiosError = err as {
                response?: { data?: { detail?: string } };
            };
            const message =
                axiosError.response?.data?.detail || "Invalid credentials";
            setError(message);
            return false;
        }
    };

    const logout = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        }
        setUser(null);
    }, []);

    const value: AuthContextType = {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export default AuthContext;
