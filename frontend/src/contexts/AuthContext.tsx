import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  country: string;
  currency: string;
  income?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateIncome: (income: number) => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  city: string;
  country: string;
  currency: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/api/auth/me');
        setUser(response.data.data);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      toast({
        title: "Account created!",
        description: "Welcome to Track My Spends.",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  const updateIncome = async (income: number) => {
    try {
      const response = await api.put('/api/auth/income', { income });
      setUser(response.data.user);
      toast({
        title: "Income updated",
        description: "Your income has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateIncome }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
