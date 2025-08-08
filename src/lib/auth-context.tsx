'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiClient } from './api';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'USER';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  getCurrentUser: () => Promise<boolean>;
}

interface CurrentUserResponse {
  user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getCurrentUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        const userData = response.data as CurrentUserResponse;
        setUser(userData.user);
        // console.log('User authenticated:', userData.user);
        return true;
      } else {
        console.log('No user found or authentication failed');
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      setUser(null);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);

      if (response.success && response.data) {
        const userData = response.data as CurrentUserResponse;
        setUser(userData.user);
        return { success: true };
      } else {
        return {
          success: false,
          error: response.error?.message || 'Login failed',
        };
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: 'Network error occurred',
        details: error,
      };
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshAuth = async () => {
    try {
      console.log('Attempting to refresh authentication token...');
      const response = await apiClient.refreshToken();
      if (response.success) {
        console.log('Token refreshed successfully');
        // After successful token refresh, get current user info
        const userFetched = await getCurrentUser();
        if (!userFetched) {
          console.log('Failed to get user info after token refresh');
          setUser(null);
        }
      } else {
        console.log('Token refresh failed:', response.error);
        setUser(null);
      }
    } catch (error) {
      console.error('Error during token refresh:', error);
      setUser(null);
    }
  };

  useEffect(() => {
    const refreshAuth = async () => {
      try {
        console.log('Attempting to refresh authentication token...');
        const response = await apiClient.refreshToken();
        if (response.success) {
          console.log('Token refreshed successfully');
          // After successful token refresh, get current user info
          const userFetched = await getCurrentUser();
          if (!userFetched) {
            console.log('Failed to get user info after token refresh');
            setUser(null);
          }
        } else {
          console.log('Token refresh failed:', response.error);
          setUser(null);
        }
      } catch (error) {
        console.error('Error during token refresh:', error);
        setUser(null);
      }
    };
    // Try to get current user on app start
    const initAuth = async () => {
      try {
        const userFetched = await getCurrentUser();
        if (!userFetched) {
          // If getting current user fails, try to refresh token
          await refreshAuth();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // If both getCurrentUser and refreshAuth fail, user is not authenticated
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (!user) return;
    const refreshAuth = async () => {
      try {
        console.log('Attempting to refresh authentication token...');
        const response = await apiClient.refreshToken();
        if (response.success) {
          console.log('Token refreshed successfully');
          // After successful token refresh, get current user info
          const userFetched = await getCurrentUser();
          if (!userFetched) {
            console.log('Failed to get user info after token refresh');
            setUser(null);
          }
        } else {
          console.log('Token refresh failed:', response.error);
          setUser(null);
        }
      } catch (error) {
        console.error('Error during token refresh:', error);
        setUser(null);
      }
    };

    const refreshInterval = setInterval(async () => {
      try {
        await refreshAuth();
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes (tokens expire in 15 minutes)

    return () => clearInterval(refreshInterval);
  }, [user]);

  return <AuthContext.Provider value={{ user, loading, login, logout, refreshAuth, getCurrentUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
