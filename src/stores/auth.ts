import { defineStore } from 'pinia';

import { ApiError, apiFetch } from '@/services/api';

import type { AuthUser, MeResponse, RegisterData } from '@/types/auth.type';

import { useNotificationsStore } from './notifications';

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
      const notificationsStore = useNotificationsStore();

      try {
        const data = await apiFetch<MeResponse>('/auth/me');

        const previousUserId = this.user?.id;

        this.user = {
          id: data.user.id,
          displayName: data.user.displayName,
          email: data.user.email,
          role: data.user.tipo,
          memberType: data.user.memberType,
        };

        // Si cambió el usuario, limpiar datos de la sesión anterior.
        if (
          previousUserId !== null &&
          previousUserId !== undefined &&
          previousUserId !== this.user.id
        ) {
          notificationsStore.clear();
        }

        // Los administradores envían notificaciones;
        // los demás usuarios reciben las suyas.
        if (!this.isAdmin) {
          notificationsStore.startRealtime();
        } else {
          notificationsStore.stopRealtime();
        }

        return this.user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          notificationsStore.clear();
          this.user = null;
          return null;
        }

        throw error;
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
      const notificationsStore = useNotificationsStore();

      try {
        await apiFetch('/auth/logout', {
          method: 'POST',
        });
      } finally {
        notificationsStore.clear();

        this.user = null;
        this.initialized = false;
      }
    },
  },
});
