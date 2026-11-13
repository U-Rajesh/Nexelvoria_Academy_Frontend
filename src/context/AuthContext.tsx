import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem } from '../utils/storage';
import { authService } from '../services/authService';
import { initializeMockDatabase } from '../mocks/mockStorage';
import type { User, UserRole, AccountState } from '../types';
import type { LoginFormData, StudentRegistrationFormData, DualOtpFormData } from '../utils/validators';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginFormData) => Promise<{
    success: boolean;
    error?: string;
    accountState?: AccountState;
    studentId?: string;
  }>;
  register: (data: StudentRegistrationFormData) => Promise<{
    success: boolean;
    tempStudentId?: string;
    email?: string;
    mobile?: string;
    error?: string;
  }>;
  verifyDualOtp: (studentId: string, otps: DualOtpFormData) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOtp: (studentId: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  verifyMobileOtp: (studentId: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendEmailOtp: (studentId: string) => Promise<{ success: boolean; error?: string }>;
  resendMobileOtp: (studentId: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  refreshCurrentUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCurrentUser = () => {
    const storedUser = getStorageItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (storedUser) {
      setUser(storedUser);
    }
  };

  useEffect(() => {
    // Ensure mock databases are seeded on initial app launch
    initializeMockDatabase();

    refreshCurrentUser();
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
    return {
      success: false,
      error: res.error,
      accountState: res.accountState,
      studentId: res.studentId,
    };
  };

  const register = async (data: StudentRegistrationFormData) => {
    setIsLoading(true);
    const res = await authService.registerStudent(data);
    setIsLoading(false);
    if (res.success && res.data) {
      return {
        success: true,
        tempStudentId: res.data.tempStudentId,
        email: res.data.email,
        mobile: res.data.mobile,
      };
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

  const verifyEmailOtp = async (studentId: string, otp: string) => {
    setIsLoading(true);
    const res = await authService.verifyEmailOtp(studentId, otp);
    setIsLoading(false);
    if (res.success && res.data) {
      setUser(res.data);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const verifyMobileOtp = async (studentId: string, otp: string) => {
    setIsLoading(true);
    const res = await authService.verifyMobileOtp(studentId, otp);
    setIsLoading(false);
    if (res.success && res.data) {
      setUser(res.data);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const resendEmailOtp = async (studentId: string) => {
    const res = await authService.resendEmailOtp(studentId);
    return { success: res.success, error: res.error };
  };

  const resendMobileOtp = async (studentId: string) => {
    const res = await authService.resendMobileOtp(studentId);
    return { success: res.success, error: res.error };
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
        verifyEmailOtp,
        verifyMobileOtp,
        resendEmailOtp,
        resendMobileOtp,
        logout,
        switchRole,
        refreshCurrentUser,
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
