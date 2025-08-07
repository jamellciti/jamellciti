import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { AuthState, User } from '../types';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: async (email: string, password: string): Promise<boolean> => {
        try {
          const response = await axios.post(`${API}/auth/login`, {
            email,
            password,
          });

          if (response.data.access_token) {
            const { access_token, user } = response.data;
            
            set({
              isAuthenticated: true,
              user: user as User,
              token: access_token,
            });

            // Set default authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
            
            return true;
          }
          return false;
        } catch (error) {
          console.error('Login failed:', error);
          return false;
        }
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
        
        // Clear authorization header
        delete axios.defaults.headers.common['Authorization'];
      },
    }),
    {
      name: 'aura-auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore authorization header on app load
        if (state?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);