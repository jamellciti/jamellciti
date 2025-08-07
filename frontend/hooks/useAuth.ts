import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// Get API base URL from environment
const API_BASE = Platform.OS === 'web' 
  ? process.env.EXPO_PUBLIC_BACKEND_URL || ''
  : process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  id: string;
  email: string;
  role: string;
  city: string;
  consent_level: string;
  subscription_tier: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Token storage utilities
  const storeToken = async (token: string, expiresIn: number = 86400) => {
    const expiry = String(Date.now() + expiresIn * 1000);
    
    if (Platform.OS === 'web') {
      localStorage.setItem('token', token);
      localStorage.setItem('token_exp', expiry);
    } else {
      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('token_exp', expiry);
    }
  };

  const getStoredToken = async (): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        const token = localStorage.getItem('token');
        const expiry = localStorage.getItem('token_exp');
        
        if (token && expiry && Date.now() < parseInt(expiry)) {
          return token;
        } else if (token) {
          localStorage.removeItem('token');
          localStorage.removeItem('token_exp');
        }
        return null;
      } else {
        const token = await SecureStore.getItemAsync('token');
        const expiry = await SecureStore.getItemAsync('token_exp');
        
        if (token && expiry && Date.now() < parseInt(expiry)) {
          return token;
        } else if (token) {
          await SecureStore.deleteItemAsync('token');
          await SecureStore.deleteItemAsync('token_exp');
        }
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const clearStoredToken = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('token');
        localStorage.removeItem('token_exp');
      } else {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('token_exp');
      }
    } catch (error) {
      // Ignore errors when clearing
    }
  };

  // Check for existing token and user on hook initialization
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getStoredToken();
        
        if (!token) {
          setAuthState({ user: null, loading: false, error: null });
          return;
        }

        // Verify token with backend
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
        });

        if (!res.ok) {
          await clearStoredToken();
          setAuthState({ user: null, loading: false, error: null });
          return;
        }

        const user = await res.json();
        setAuthState({ user, loading: false, error: null });

      } catch (error) {
        await clearStoredToken();
        setAuthState({ user: null, loading: false, error: null });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(errorData.detail || 'Login failed');
      }

      const { access_token } = await res.json();

      // Store token
      await storeToken(access_token, 86400);

      // Get user profile
      const userRes = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json' 
        },
      });

      if (!userRes.ok) {
        throw new Error('Failed to get user profile');
      }

      const user = await userRes.json();
      
      setAuthState({ user, loading: false, error: null });

      // Direct navigation after successful login
      const targetPath = (!user.consent_level || user.consent_level === 'none') 
        ? '/consent-wizard' 
        : '/dashboard';
      
      router.replace(targetPath);

    } catch (error: any) {
      setAuthState({ 
        user: null, 
        loading: false, 
        error: error.message || 'Login failed' 
      });
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    await clearStoredToken();
    setAuthState({ user: null, loading: false, error: null });
    router.replace('/login');
  };

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    login,
    logout,
    isAuthenticated: !!authState.user,
  };
}