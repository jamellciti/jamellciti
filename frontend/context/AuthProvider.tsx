import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

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
  
  // Add flag to prevent bootAuth loops during navigation
  const [isNavigating, setIsNavigating] = useState(false);
  // Add ref to track bootAuth execution
  const bootAuthExecuted = useRef(false);
  
  console.log('🛡️ AuthProvider render – authState:', authState);
  
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
      const meRes = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json' 
        },
      });

      let userProfile = userData;
      if (meRes.ok) {
        userProfile = await meRes.json();
      }

      // Step 4: Commit state BEFORE navigation (critical for guards)
      setAuthState({
        user: userProfile,
        token: access_token,
        loading: false,
        error: null,
      });

      // Step 5: 🔥 Force navigation now that authState is settled
      const targetPath = (!userProfile.consent_level || userProfile.consent_level === 'none') 
        ? '/consent-wizard' 
        : '/dashboard';
      
      router.replace(targetPath as any);

      // On web, ensure URL bar sync
      if (Platform.OS === 'web') {
        setTimeout(() => {
          window.history.replaceState(null, '', targetPath);
        }, 0);
      }

    } catch (err: any) {
      console.error('LOGIN ERROR', err);
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

  // Check for stored token on app boot
  useEffect(() => {
    console.log('🏁 bootAuth useEffect start - authState:', authState.loading, authState.token, 'executed:', bootAuthExecuted.current);
    
    // Prevent multiple executions of bootAuth
    if (bootAuthExecuted.current) {
      console.log('🏁 bootAuth already executed, skipping');
      return;
    }
    
    // Skip bootAuth if we already have a token (avoid overriding fresh login)
    if (authState.token) {
      console.log('🏁 Already authenticated with token, skipping bootAuth');
      return;
    }
    
    // Skip bootAuth if we're currently navigating
    if (isNavigating) {
      console.log('🏁 Currently navigating, skipping bootAuth');
      return;
    }
    
    const bootAuth = async () => {
      try {
        bootAuthExecuted.current = true;
        console.log('🏁 bootAuth function start - setting executed flag to true');
        
        const token = await getStoredToken();
        console.log('🏁 Retrieved token:', token ? token.slice(0, 12) + '...' : null);
        
        if (!token) {
          console.log('🏁 No token found, setting loading=false');
          setAuthState({ user: null, token: null, loading: false, error: null });
          return;
        }

        console.log('🏁 Token found, verifying with API...');
        // Verify token by fetching user profile
        const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
        });

        if (!res.ok) {
          console.log('🏁 Token verification failed, clearing token and setting loading=false');
          // Clear invalid token and set loading to false BEFORE navigation
          await clearStoredToken();
          setAuthState({ user: null, token: null, loading: false, error: null });
          return;
        }

        console.log('🏁 Token verified, getting user info...');
        const userInfo = await res.json();
        console.log('🏁 User info received, setting auth state with loading=false');

        setAuthState({ 
          user: userInfo, 
          token, 
          loading: false, 
          error: null 
        });
        
        console.log('🏁 bootAuth completed successfully');

      } catch (error) {
        console.log('🏁 bootAuth error:', error);
        // Ensure loading state is cleared on any error
        await clearStoredToken();
        setAuthState({ user: null, token: null, loading: false, error: null });
      }
    };

    bootAuth();
  }, []); // Only run once on mount

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