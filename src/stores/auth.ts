import { defineStore } from 'pinia';

export type UserRole = 'BACKOFFICE' | 'SOCIO' | 'POSTULANTE';

type FakeUser = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
};

const fakeUsers: FakeUser[] = [
  {
    email: 'admin@ccisj.uy',
    password: '1234',
    role: 'BACKOFFICE',
    name: 'Martín Alonso',
  },
  {
    email: 'socio@ccisj.uy',
    password: '1234',
    role: 'SOCIO',
    name: 'Empresa de Prueba',
  },
  {
    email: 'postulante@ccisj.uy',
    password: '1234',
    role: 'POSTULANTE',
    name: 'Juan Pérez',
  },
];

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as Omit<FakeUser, 'password'> | null,
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
    role: (state) => state.user?.role ?? null,
  },

  actions: {
    login(email: string, password: string) {
      const foundUser = fakeUsers.find(
        (user) => user.email === email && user.password === password,
      );

      if (!foundUser) {
        throw new Error('Correo o contraseña incorrectos');
      }

      const { password: _password, ...user } = foundUser;

      this.user = user;

      return user;
    },

    logout() {
      this.user = null;
    },
  },
});
