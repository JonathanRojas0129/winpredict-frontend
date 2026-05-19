// store/authStore.ts
// Estado global de autenticación con Zustand
// crafted by JR ♥  |  fix: persistencia JWT al recargar + hidratación desde localStorage

import { create } from 'zustand';
import api from '@/lib/axios';

interface User {
  id: string;
  nombre: string;
  email: string;
  es_pro: boolean;
  avatar_url?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean; // true cuando ya leímos localStorage

  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>; // llama a /auth/me con el token guardado
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  // Hidrata el store al recargar la página:
  // lee el token de localStorage y valida con GET /auth/me
  hydrate: async () => {
    if (get().hydrated) return;

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('token')
      : null;

    if (!token) {
      set({ hydrated: true });
      return;
    }

    try {
      // axios ya agrega el header Authorization via interceptor en lib/axios.ts
      const res = await api.get('/auth/me');
      set({ user: res.data, token, isAuthenticated: true, hydrated: true });
    } catch {
      // Token expirado o inválido — limpiar
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, hydrated: true });
    }
  },
}));

export default useAuthStore;
