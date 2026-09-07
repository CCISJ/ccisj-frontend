import { defineStore } from 'pinia';

export type UserRole = 'ADMIN' | 'SOCIO' | 'POSTULANTE';
export type MemberType = 'COMUN' | 'DIRECTIVO';

type FakeUser = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  memberType?: MemberType;
};

type AuthUser = Omit<FakeUser, 'password'>;

const fakeUsers: FakeUser[] = [
  {
    email: 'admin@ccisj.uy',
    password: '1234',
    role: 'ADMIN',
    name: 'Martín Alonso',
  },
  {
    email: 'directivo@ccisj.uy',
    password: '1234',
    role: 'SOCIO',
    memberType: 'DIRECTIVO',
    name: 'Empresa Directiva',
  },
  {
    email: 'socio@ccisj.uy',
    password: '1234',
    role: 'SOCIO',
    memberType: 'COMUN',
    name: 'Empresa de Prueba',
  },
  {
    email: 'postulante@ccisj.uy',
    password: '1234',
    role: 'POSTULANTE',
    name: 'Juan Pérez',
  },
];

function getStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem('authUser');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem('authUser');
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: getStoredUser(),
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

      localStorage.setItem('authUser', JSON.stringify(user));

      return user;
    },

    logout() {
      this.user = null;
      localStorage.removeItem('authUser');
    },
  },
});
