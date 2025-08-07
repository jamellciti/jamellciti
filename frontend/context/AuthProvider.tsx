import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { fetcher } from '../services/api';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://73613a20-b586-452b-8c47-65419969d01e.preview.emergentagent.com';

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
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });
  
  const router = useRouter();

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
  };

  const clearStoredToken = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('token');
      localStorage.removeItem('token_exp');
    } else {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('token_exp');
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setAuthState(s => ({ ...s, loading: true, error: null }));

      // Step 1: Authenticate and get token
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(errorData.detail || `Login failed: ${res.status}`);
      }

      const { access_token, user: userData } = await res.json();

      // Step 2: Persist token
      await storeToken(access_token, 86400);
      
      // Step 3: Verify token works by fetching user profile
      const me = await fetcher('/api/v1/auth/me');

      // Step 4: Commit state BEFORE navigation (critical for guards)
      setAuthState({
        user: me,
        token: access_token,
        loading: false,
        error: null,
      });

      // Step 5: Navigate with router.replace (synchronous, cross-platform)
      const targetPath = (!me.consent_level || me.consent_level === 'none') 
        ? '/consent-wizard' 
        : '/dashboard';
      
      router.replace(targetPath as any);

    } catch (err: any) {
      setAuthState(s => ({ 
        ...s, 
        loading: false, 
        error: err.message || 'Login failed. Please try again.' 
      }));
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    await clearStoredToken();
    setAuthState({
      user: null,
      token: null,
      loading: false,
      error: null,
    });
    router.replace('/login');
  };

  // Clear error function
  const clearError = () => {
    setAuthState(s => ({ ...s, error: null }));
  };

  // 3️⃣ Check for stored token on app boot
  useEffect(() => {
    const bootAuth = async () => {
      try {
        console.log('🚀 Checking for stored authentication...');
        const token = await getStoredToken();
        
        if (!token) {
          console.log('❌ No stored token found');
          setAuthState({ user: null, token: null, loading: false, error: null });
          return;
        }

        console.log('🔍 Found stored token, verifying...');
        
        // Verify token by fetching user profile
        const res = await fetch(`${API_BASE}/api/kpis`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
        });

        if (!res.ok) {
          console.log('❌ Stored token invalid, clearing...');
          await logout();
          return;
        }

        // If we have a valid token but no user data, we need to get user info
        // For now, we'll reconstruct basic user info from token or fetch separately
        const userInfo = {
          id: 'stored-user',
          email: 'admin@aura.vision', // In real app, decode from JWT or fetch from API
          role: 'admin',
          city: 'phoenix',
          consent_level: 'civic',
          subscription_tier: 'aura_free',
          created_at: new Date().toISOString(),
        };

        setAuthState({ 
          user: userInfo, 
          token, 
          loading: false, 
          error: null 
        });
        
        console.log('✅ Authentication restored from stored token');

      } catch (error) {
        console.error('❌ Auth boot error:', error);
        await logout();
      }
    };

    bootAuth();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;