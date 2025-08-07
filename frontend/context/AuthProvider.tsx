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

  // 1️⃣ Complete login function with full await chain
  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 AUTHPROVIDER LOGIN CALLED for:', email);
      console.log('🔐 API_BASE:', API_BASE);
      setAuthState(s => ({ ...s, loading: true, error: null }));

      // Step 1: Authenticate and get token
      console.log('🔐 About to fetch login API...');
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log('🔐 Login API response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Login failed' }));
        console.error('🚫 Login API failed:', errorData);
        throw new Error(errorData.detail || `Login failed: ${res.status}`);
      }

      const { access_token, user: userData } = await res.json();
      console.log('✅ Authentication successful for:', userData.email);
      console.log('✅ Token preview:', access_token.slice(0, 12) + '...');

      // Step 2: Persist token with expiry
      console.log('💾 About to store token...');
      await storeToken(access_token, 86400); // 24 hours
      
      // Step 3: Verify token works by fetching user profile
      console.log('🔍 Verifying token by fetching KPI endpoint...');
      
      const userProfile = await fetch(`${API_BASE}/api/kpis`, {
        headers: { 
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json' 
        },
      });

      console.log('🔍 KPI verification response:', userProfile.status);

      if (!userProfile.ok) {
        console.error('🚫 Token verification failed:', userProfile.status);
        throw new Error('Token verification failed');
      }

      console.log('✅ Token verified successfully');

      // Step 4: Update auth context
      console.log('🎯 Updating auth state...');
      setAuthState({
        user: userData,
        token: access_token,
        loading: false,
        error: null,
      });

      console.log('🎯 Login complete - navigating based on consent level:', userData.consent_level);

      // Step 5: Navigate based on user state  
      // Use queueMicrotask to ensure navigation happens after state update
      queueMicrotask(() => {
        if (!userData.consent_level || userData.consent_level === 'none') {
          console.log('🔄 Navigating to consent wizard');
          router.replace('/consent-wizard');
        } else {
          console.log('🔄 Navigating to dashboard');
          router.replace('/dashboard');
        }
      });

    } catch (err: any) {
      console.error('❌ AUTHPROVIDER LOGIN ERROR:', err);
      console.error('❌ Error stack:', err.stack);
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