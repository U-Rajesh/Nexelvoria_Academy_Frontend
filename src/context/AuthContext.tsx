import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/appConfig';
import { getStorageItem } from '../utils/storage';
import {
  ACCOUNT_STATE_BY_CODE,
  authService,
  type AccountStateCode,
  type EmailVerificationStatus,
  type OtpResendStatus,
} from '../services/authService';
import { initializeMockDatabase } from '../mocks/mockStorage';
import type { User, UserRole, AccountState } from '../types';
import type { LoginFormData, StudentRegistrationFormData } from '../utils/validators';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginFormData) => Promise<{
    success: boolean;
    error?: string;
    /** The `ACCOUNT_*` refusal code, when the account state was the reason. */
    code?: AccountStateCode;
    /** `code` mapped onto the state the banner renders. */
    accountState?: AccountState;
    /** Only with ACCOUNT_PENDING_VERIFICATION. */
    verificationTicket?: string;
  }>;
  register: (data: StudentRegistrationFormData) => Promise<{
    success: boolean;
    tempStudentId?: string;
    verificationTicket?: string;
    email?: string;
    mobile?: string;
    error?: string;
  }>;
  /**
   * Verifies the email OTP against the backend.
   *
   * Returns the account STATUS and deliberately does not set the current
   * user: verifying an email is not a login, and the endpoint issues no
   * token. The student signs in afterwards.
   *
   * Mobile and dual-OTP variants are absent because mobile OTP is descoped
   * (BR-014 disables SMS) - see authService for the full note.
   */
  verifyEmailOtp: (
    studentId: string,
    otp: string
  ) => Promise<{ success: boolean; error?: string; status?: EmailVerificationStatus }>;
  resendEmailOtp: (
    studentId: string
  ) => Promise<{ success: boolean; error?: string; status?: OtpResendStatus }>;
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
      /**
       * The machine-readable refusal code, and the state it maps to.
       *
       * Replaces the old `accountState` + `studentId` pair. The code is what
       * the page branches on; `accountState` is derived from it purely so the
       * existing `AccountStatusBanner` - which switches on `AccountState` -
       * needs no rewrite. `ACCOUNT_PENDING` maps to `undefined`, because
       * there is no honest state for "we could not tell which".
       */
      code: res.code,
      accountState: res.code === undefined ? undefined : ACCOUNT_STATE_BY_CODE[res.code],
      /**
       * Present only with ACCOUNT_PENDING_VERIFICATION. Opaque and
       * short-lived; it identifies the account for the OTP endpoints so no
       * student id has to travel in a URL.
       */
      verificationTicket: res.verificationTicket,
    };
  };

  const register = async (data: StudentRegistrationFormData) => {
    setIsLoading(true);
    const res = await authService.registerStudent(data);
    setIsLoading(false);
    if (res.success && res.data) {
      return {
        success: true,
        /** DEPRECATED, retained for compatibility. Never put it in a URL. */
        tempStudentId: res.data.tempStudentId,
        /** What the OTP screen should carry forward. */
        verificationTicket: res.data.verificationTicket,
        email: res.data.email,
        mobile: res.data.mobile,
      };
    }
    return { success: false, error: res.error };
  };

  const verifyEmailOtp = async (studentId: string, otp: string) => {
    setIsLoading(true);
    const res = await authService.verifyEmailOtp(studentId, otp);
    setIsLoading(false);

    // NO setUser HERE, on purpose. The previous mock called
    // `setUser(res.data)` with a full StudentProfile, which turned holding a
    // six-digit code into a session with no password. The real endpoint
    // returns status only and issues no token.
    if (res.success && res.data) {
      return { success: true, status: res.data };
    }

    return { success: false, error: res.error };
  };

  const resendEmailOtp = async (studentId: string) => {
    const res = await authService.resendEmailOtp(studentId);

    if (res.success && res.data) {
      return { success: true, status: res.data };
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
        verifyEmailOtp,
        resendEmailOtp,
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
