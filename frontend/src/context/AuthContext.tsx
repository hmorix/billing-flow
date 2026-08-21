import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  logoUrl?: string | null;
  invoiceTemplate?: string;
  emailTemplate?: string;
  address?: string | null;
  taxId?: string | null;
  phone?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpFrom?: string | null;
  smtpHasPassword?: boolean;
  paymentQrLink?: string | null;
}


interface AuthContextType {
  token: string | null;
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, organization: Organization) => void;
  logout: () => void;
  updateOrganization: (org: Partial<Organization>) => void;
  verifyEmail: (code: string) => Promise<boolean>;
  sendVerificationCode: () => Promise<{ message: string; code?: string }>;
  apiFetch: (url: string, options?: RequestInit) => Promise<any>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (newToken: string, newUser: User, newOrg: Organization) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    setOrganization(newOrg);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setOrganization(null);
  };

  const updateOrganization = (updatedFields: Partial<Organization>) => {
    if (organization) {
      setOrganization({ ...organization, ...updatedFields });
    }
  };

  const sendVerificationCode = async () => {
    return apiFetch('/api/auth/send-verification', { method: 'POST' });
  };

  const verifyEmail = async (code: string) => {
    const res = await apiFetch('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    if (res.isVerified && user) {
      setUser({ ...user, isVerified: true });
      return true;
    }
    return false;
  };

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error('Session expired. Please sign in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/pdf')) {
      return response.blob();
    }

    return response.json();
  };

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setOrganization(data.organization);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to restore authentication session:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      organization,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
      updateOrganization,
      verifyEmail,
      sendVerificationCode,
      apiFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
