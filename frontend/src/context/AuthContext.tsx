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
  termsConditions?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  bankUpiId?: string | null;
  signatoryName?: string | null;
  signatoryDesignation?: string | null;
  thanksMessage?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  businessType?: 'hybrid' | 'service' | 'product';
  autoDeductInventory?: boolean;
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

import { browserCache } from '../utils/browserCache';

// In-memory API cache backup
const _apiCache = new Map<string, { data: any; ts: number }>();

const AuthContext = createContext<AuthContextType | undefined>(undefined);


// Restore persisted auth state synchronously to avoid the loading spinner flash
const _storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('auth_user') || 'null'); } catch { return null; }
})();
const _storedOrg = (() => {
  try { return JSON.parse(localStorage.getItem('auth_org') || 'null'); } catch { return null; }
})();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(_storedUser);
  const [organization, setOrganization] = useState<Organization | null>(_storedOrg);
  // If we have cached auth data, skip the loading spinner entirely
  const [isLoading, setIsLoading] = useState(!(_storedUser && _storedOrg && localStorage.getItem('token')));

  const login = (newToken: string, newUser: User, newOrg: Organization) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    localStorage.setItem('auth_org', JSON.stringify(newOrg));
    setToken(newToken);
    setUser(newUser);
    setOrganization(newOrg);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_org');
    setToken(null);
    setUser(null);
    setOrganization(null);
    _apiCache.clear();
    browserCache.clearAll(); // Wipe all tenant cache from local browser storage on logout
  };


  const updateOrganization = (updatedFields: Partial<Organization>) => {
    if (organization) {
      const updated = { ...organization, ...updatedFields };
      setOrganization(updated);
      localStorage.setItem('auth_org', JSON.stringify(updated));
      // Invalidate org settings cache so views fetch new values
      browserCache.invalidate('/api/organization', updated.id);
      browserCache.invalidate('/api/auth/me', updated.id);
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
      const updated = { ...user, isVerified: true };
      setUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
      return true;
    }
    return false;
  };

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const orgId = organization?.id || _storedOrg?.id || 'global';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    // --- GET REQUESTS: BROWSER DATABASE CACHE-FIRST / SWR ---
    if (method === 'GET') {
      const cached = browserCache.get(endpoint, orgId);

      // If we have cached local data:
      if (cached) {
        // If fresh (under 2 minutes), return instantly (0ms)
        if (cached.isFresh) {
          return cached.data;
        }

        // Stale-While-Revalidate: Return cached data immediately so UI never waits,
        // and trigger a silent background sync to update local browser storage
        fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers })
          .then(async (res) => {
            if (res.ok) {
              const contentType = res.headers.get('Content-Type');
              if (contentType && !contentType.includes('application/pdf')) {
                const freshData = await res.json();
                browserCache.set(endpoint, freshData, orgId);
              }
            }
          })
          .catch(() => {}); // Suppress background fetch errors

        return cached.data;
      }
    }

    // --- NETWORK FETCH (Cache Miss or Mutations: POST/PUT/DELETE) ---
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

    const data = await response.json();

    // Cache successful GET responses in persistent local browser DB
    if (method === 'GET') {
      browserCache.set(endpoint, data, orgId);
    } else {
      // Mutations (POST, PUT, DELETE): intelligently invalidate affected local caches
      // so all tabs/views immediately sync with fresh data on their next visit
      browserCache.invalidateForMutation(endpoint, orgId);
      _apiCache.clear();
    }

    return data;
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
          // Keep localStorage in sync with fresh server data
          localStorage.setItem('auth_user', JSON.stringify(data.user));
          localStorage.setItem('auth_org', JSON.stringify(data.organization));
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to restore authentication session:', err);
        // Don't logout on network error — keep showing cached data
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
