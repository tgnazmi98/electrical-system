export interface User {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
}

export interface LoginCredentials {
    username: string;
    password: string;
}
