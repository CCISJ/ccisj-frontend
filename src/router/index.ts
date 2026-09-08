import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
    },

    {
      path: '/',
      component: () => import('@/views/RootView.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'socios',
          name: 'socios',
          component: () => import('@/views/members/MembersView.vue'),
          meta: {
            roles: ['ADMIN', 'SOCIO'],
            directivoOnly: true,
          },
        },
        {
          path: 'socios/nuevo',
          name: 'socio-nuevo',
          component: () => import('@/views/members/CreateMemberView.vue'),
          meta: {
            roles: ['ADMIN'],
          },
        },
        {
          path: 'socios/:id',
          name: 'socio-detalle',
          component: () => import('@/views/members/MemberDetailView.vue'),
          meta: {
            roles: ['ADMIN', 'SOCIO'],
            directivoOnly: true,
          },
        },

        // Cualquier otra URL dentro del sistema cae acá en vez de dejar la
        // pantalla en blanco.
        {
          path: ':pathMatch(.*)*',
          name: 'not-found',
          component: () => import('@/views/NotFoundView.vue'),
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (!auth.isAuthenticated && to.path !== '/login') {
    return '/login';
  }

  if (auth.isAuthenticated && to.path === '/login') {
    return '/';
  }

  const roles = to.meta.roles as string[] | undefined;

  if (roles && auth.role && !roles.includes(auth.role)) {
    return '/';
  }

  if (
    to.meta.directivoOnly &&
    auth.role === 'SOCIO' &&
    auth.user?.memberType !== 'DIRECTIVO'
  ) {
    return '/';
  }
});

export default router;
