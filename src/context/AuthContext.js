// src/context/AuthContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Storage } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => Storage.getCurrentUser());

  const login = useCallback((email, password) => {
    const found = Storage.login(email, password);
    if (found) { setUser(found); return true; }
    return false;
  }, []);

  const logout = useCallback(() => {
    Storage.logout();
    setUser(null);
  }, []);

  const register = useCallback((data) => {
    const users = Storage.getUsers();
    if (users.find(u => u.email === data.email)) return { error: 'Email уже зарегистрирован' };
    const newUser = { id: `user-${Date.now()}`, ...data };
    Storage.addUser(newUser);
    Storage.login(data.email, data.password);
    setUser(newUser);
    return { success: true };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
