'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '@/app/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (authResponse: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (authResponse: AuthResponse) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', authResponse.accessToken);
          localStorage.setItem('refreshToken', authResponse.refreshToken);
          localStorage.setItem('user', JSON.stringify(authResponse.user));
        }
        set({
          user: authResponse.user,
          accessToken: authResponse.accessToken,
          refreshToken: authResponse.refreshToken,
          isAuthenticated: true,
        });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state && state.accessToken) {
          try {
            const base64Url = state.accessToken.split('.')[1];
            if (!base64Url) return;
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const { exp } = JSON.parse(jsonPayload);
            const now = Date.now() / 1000;
            
            if (exp < now) {
              console.log('Token expired, clearing session');
              state.logout();
            }
          } catch (e) {
            console.error('Token validation failed', e);
            state.logout();
          }
        }
      },
    }
  )
);
