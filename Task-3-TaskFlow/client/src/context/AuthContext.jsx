import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";

const defaultAuthContext = {
  user: null,
  loading: false,
  login: async () => undefined,
  register: async () => undefined,
  logout: () => undefined,
  updateUser: () => undefined,
};

const AuthContext = createContext(defaultAuthContext);

/**
 * Provides authentication state (user, token, loading) and the
 * login/register/logout actions to the entire app. Persists the
 * session in localStorage so a page refresh doesn't log the user out.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore the session from localStorage and verify
  // the token is still valid by fetching the live profile.
  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem("taskflow_token");
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/profile");
        setUser(data.data.user);
      } catch (error) {
        localStorage.removeItem("taskflow_token");
        localStorage.removeItem("taskflow_user");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const { user: loggedInUser, token } = data.data;
    localStorage.setItem("taskflow_token", token);
    localStorage.setItem("taskflow_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    const { user: newUser, token } = data.data;
    localStorage.setItem("taskflow_token", token);
    localStorage.setItem("taskflow_user", JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem("taskflow_token");
    localStorage.removeItem("taskflow_user");
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
    const currentUser = user ?? null;
    localStorage.setItem("taskflow_user", JSON.stringify({ ...(currentUser || {}), ...updatedFields }));
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
