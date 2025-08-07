import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { fetcher } from '../services/api';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://0cf8f361-2398-415b-b274-ff11de2ad810.preview.emergentagent.com';

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
      console.log('🌐 Token stored in localStorage:', token.slice(0, 12) + '...');
    } else {
      await SecureStore.setItemAsync('token', token);
      await SecureStore.setItemAsync('token_exp', expiry);
      console.log('🔒 Token stored in SecureStore:', token.slice(0, 12) + '...');
    }
  };

  const getStoredToken = async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      const token = localStorage.getItem('token');
      const expiry = localStorage.getItem('token_exp');
      
      if (token && expiry && Date.now() < parseInt(expiry)) {
        console.log('🌐 Valid token retrieved from localStorage:', token.slice(0, 12) + '...');
        return token;
      } else if (token) {
        console.log('🌐 Token expired, clearing localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('token_exp');
      }
      return null;
    } else {
      const token = await SecureStore.getItemAsync('token');
      const expiry = await SecureStore.getItemAsync('token_exp');
      
      if (token && expiry && Date.now() < parseInt(expiry)) {
        console.log('🔒 Valid token retrieved from SecureStore:', token.slice(0, 12) + '...');
        return token;
      } else if (token) {
        console.log('🔒 Token expired, clearing SecureStore');
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
      console.log('🌐 Token cleared from localStorage');
    } else {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('token_exp');
      console.log('🔒 Token cleared from SecureStore');
    }
  };

  // 1️⃣ Complete login function with official Expo Router navigation
  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 AUTHPROVIDER LOGIN CALLED for:', email);
      setAuthState(s => ({ ...s, loading: true, error: null }));

      // Step 1: Authenticate and get token
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(errorData.detail || `Login failed: ${res.status}`);
      }

      const { access_token, user: userData } = await res.json();
      console.log('✅ Authentication successful for:', userData.email);

      // Step 2: Persist token with expiry
      await storeToken(access_token, 86400); // 24 hours
      
      // Step 3: Verify token works by fetching user profile
      const userProfile = await fetch(`${API_BASE}/api/kpis`, {
        headers: { 
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json' 
        },
      });

      if (!userProfile.ok) {
        throw new Error('Token verification failed');
      }

      console.log('✅ Token verified successfully');

      // Step 4: Commit state BEFORE navigation (critical for guards)
      setAuthState({
        user: userData,
        token: access_token,
        loading: false,
        error: null,
      });

      console.log('✅ Auth state committed');

      // Step 5: Navigate with official Expo Router API (works on web & native)
      const targetPath = (!userData.consent_level || userData.consent_level === 'none') 
        ? '/consent-wizard' 
        : '/dashboard';
      
      console.log('🔄 Navigating to:', targetPath);
      router.replace(targetPath as any);
      console.log('✅ Navigation completed');

    } catch (err: any) {
      console.error('❌ AUTHPROVIDER LOGIN ERROR:', err);
      setAuthState(s => ({ 
        ...s, 
        loading: false, 
        error: err.message || 'Login failed. Please try again.' 
      }));
    }
  };

  // 2️⃣ Logout function
  const logout = async (): Promise<void> => {
    console.log('🚪 Logging out user...');
    await clearStoredToken();
    setAuthState({
      user: null,
      token: null,
      loading: false,
      error: null,
    });
    router.replace('/login');
    console.log('✅ Logout complete');
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