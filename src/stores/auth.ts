import { defineStore } from 'pinia';
import { apiFetch } from '@/services/api';

import type { AuthUser, MeResponse } from '@/types/auth.type';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
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
      } catch (error) {
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
