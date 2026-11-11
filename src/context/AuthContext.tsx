import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem } from '../utils/storage';
import { authService } from '../services/authService';
import { initializeMockDatabase } from '../mocks/mockStorage';
import type { User, UserRole } from '../types';
import type { LoginFormData, StudentRegistrationFormData, DualOtpFormData } from '../utils/validators';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginFormData) => Promise<{ success: boolean; error?: string }>;
  register: (data: StudentRegistrationFormData) => Promise<{ success: boolean; tempStudentId?: string; error?: string }>;
  verifyDualOtp: (studentId: string, otps: DualOtpFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure mock databases are seeded on initial app launch
    initializeMockDatabase();

    const storedUser = getStorageItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginFormData) => {
    setIsLoading(true);
    const res = await authService.login(credentials);
    setIsLoading(false);
    if (res.success && res.data) {
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const register = async (data: StudentRegistrationFormData) => {
    setIsLoading(true);
    const res = await authService.registerStudent(data);
    setIsLoading(false);
    if (res.success && res.data) {
      return { success: true, tempStudentId: res.data.tempStudentId };
    }
    return { success: false, error: res.error };
  };

  const verifyDualOtp = async (studentId: string, otps: DualOtpFormData) => {
    setIsLoading(true);
    const res = await authService.verifyDualOtp(studentId, otps);
    setIsLoading(false);
    if (res.success && res.data) {
      setUser(res.data);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    const updated = authService.switchRole(newRole);
    setUser(updated);
  };

  const role: UserRole = user ? user.role : 'public';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        register,
        verifyDualOtp,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

