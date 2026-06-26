import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type BusinessUser, type Business } from '../services/auth.service';

interface AuthContextType {
  user: BusinessUser | null;
  business: Business | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; cuit?: string; responsable_nombre?: string; responsable_dni?: string; domicilio_real?: string; address?: string; address_lat?: number; address_lng?: number }) => Promise<void>;
  logout: () => void;
  updateBusiness: (biz: Business) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<BusinessUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    const storedBiz = authService.getStoredBusiness();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
      setBusiness(storedBiz);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    setBusiness(result.business);
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string; cuit?: string; responsable_nombre?: string; responsable_dni?: string; domicilio_real?: string; address?: string; address_lat?: number; address_lng?: number }) => {
    const result = await authService.register(data);
    setUser(result.user);
    setBusiness(result.business);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setBusiness(null);
  };

  const updateBusiness = (biz: Business) => {
    setBusiness(biz);
    localStorage.setItem('business', JSON.stringify(biz));
  };

  return (
    <AuthContext.Provider value={{ user, business, loading, login, register, logout, updateBusiness }}>
      {children}
    </AuthContext.Provider>
  );
};
