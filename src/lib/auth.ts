// ⚠️ WARNING: This is a CLIENT-SIDE ONLY mock implementation for development.
// DO NOT use in production! This is NOT secure and can be easily manipulated.
// For production, integrate with a proper backend authentication system.

export type UserRole = "admin" | "user";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const STORAGE_KEY = "auth_user";

export const authService = {
  login: (email: string, password: string): AuthUser | null => {
    // Mock authentication - DO NOT USE IN PRODUCTION
    if (email === "admin@system.com" && password === "admin123") {
      const user: AuthUser = {
        id: "1",
        name: "Admin User",
        email: "admin@system.com",
        role: "admin",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    }
    if (email === "user@system.com" && password === "user123") {
      const user: AuthUser = {
        id: "2",
        name: "Regular User",
        email: "user@system.com",
        role: "user",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  getCurrentUser: (): AuthUser | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  isAdmin: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === "admin";
  },
};
