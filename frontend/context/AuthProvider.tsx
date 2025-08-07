import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    console.log('🔐 LOGIN FUNCTION CALLED with:', email);
    try {
      console.log('🔐 LOGIN: Setting loading state...');
      setAuthState(s => ({ ...s, loading: true, error: null }));

      console.log('🔐 LOGIN: Making API call to', `${API_BASE}/api/v1/auth/login`);
      // Step 1: Authenticate and get token
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        console.log('🔐 LOGIN ERROR: API call failed with status:', res.status);
        const errorData = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(errorData.detail || `Login failed: ${res.status}`);
      }

      console.log('🔐 LOGIN: API call successful, parsing response...');
      const { access_token, user: userData } = await res.json();
      console.log('🔐 LOGIN: Got token and user data, storing token...');

      // Step 2: Persist token
      await storeToken(access_token, 86400);
      console.log('🔐 LOGIN: Token stored, verifying with /auth/me...');
      
      // Step 3: Verify token works by fetching user profile
      const meRes = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json' 
        },
      });

      let userProfile = userData;
      if (meRes.ok) {
        console.log('🔐 LOGIN: Profile verification successful');
        userProfile = await meRes.json();
      } else {
        console.log('🔐 LOGIN: Profile verification failed, using original user data');
      }

      console.log('🔐 LOGIN: Setting auth state with user data...');
      // Step 4: Commit state BEFORE navigation (critical for guards)
      setAuthState({
        user: userProfile,
        token: access_token,
        loading: false,
        error: null,
      });

      // Step 5: Navigate with router.replace (synchronous, cross-platform)
      const targetPath = (!userProfile.consent_level || userProfile.consent_level === 'none') 
        ? '/consent-wizard' 
        : '/dashboard';
      
      console.log('🚀 NAVIGATION: About to navigate to:', targetPath);
      console.log('🚀 NAVIGATION: User consent level:', userProfile.consent_level);
      
      // Set navigation flag to prevent bootAuth re-execution
      setIsNavigating(true);
      
      router.replace(targetPath as any);
      console.log('🚀 NAVIGATION: router.replace() called');

      // Final 5%: Force URL sync for web to ensure browser location updates immediately
      if (Platform.OS === 'web') {
        console.log('🚀 NAVIGATION: Web - forcing URL sync with window.history');
        // Ensure React state and browser history are in sync
        setTimeout(() => {
          window.history.replaceState(null, '', targetPath);
          console.log('🚀 NAVIGATION: window.history.replaceState() executed');
          // Clear navigation flag after URL sync
          setIsNavigating(false);
        }, 100);
      } else {
        // Clear navigation flag for native platforms
        setTimeout(() => setIsNavigating(false), 100);
      }

    } catch (err: any) {
      console.log('🔐 LOGIN ERROR in catch block:', err);
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
    console.log('🏁 bootAuth useEffect start, isNavigating:', isNavigating);
    
    // Skip bootAuth if we're currently navigating
    if (isNavigating) {
      console.log('🏁 Skipping bootAuth - currently navigating');
      return;
    }
    
    const bootAuth = async () => {
      try {
        console.log('🏁 bootAuth function start');
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
        
        console.log('🏁 bootAuth success, loading=false');

      } catch (error) {
        console.log('🏁 bootAuth error:', error);
        // Ensure loading state is cleared on any error
        await clearStoredToken();
        setAuthState({ user: null, token: null, loading: false, error: null });
        console.log('🏁 Error handled, loading=false');
      }
    };

    bootAuth();
  }, [isNavigating]); // Add isNavigating as dependency

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