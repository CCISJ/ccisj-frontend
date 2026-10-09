import { defineStore } from 'pinia';

import { apiFetch } from '@/services/api';

import type { AuthUser, MeResponse, RegisterData } from '@/types/auth.type';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
    isAdmin: (state) => state.user?.role === 'ADMIN',
    role: (state) => state.user?.role ?? null,
  },

  actions: {
    async login(email: string, password: string) {
      await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      await this.fetchMe();

      return this.user;
    },

    /** Registro público de postulantes: crea la cuenta y deja la sesión iniciada. */
    async register(data: RegisterData) {
      await apiFetch('/auth/registro', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      await this.fetchMe();

      return this.user;
    },

    async fetchMe() {
      try {
        const data = await apiFetch<MeResponse>('/auth/me');

        this.user = {
          id: data.user.id,
          displayName: data.user.displayName,
          email: data.user.email,
          role: data.user.tipo,
          memberType: data.user.memberType,
        };

        return this.user;
      } catch {
        // Que esto falle es la respuesta normal a "¿hay sesión?": si
        // `/auth/me` contesta 401, no hay nadie logueado y no hay nada que
        // manejar. El error se descarta a propósito, no por descuido; el
        // `catch` sin variable lo deja dicho.
        this.user = null;

        return null;
      }
    },

    async initialize() {
      if (this.initialized) {
        return;
      }

      await this.fetchMe();

      this.initialized = true;
    },

    async logout() {
      try {
        await apiFetch('/auth/logout', {
          method: 'POST',
        });
      } finally {
        this.user = null;
        this.initialized = false;
      }
    },
  },
});
