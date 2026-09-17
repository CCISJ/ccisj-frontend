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
          path: 'socios/:id(\\d+)/editar',
          name: 'socio-editar',
          component: () => import('@/views/members/EditMemberView.vue'),
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
        {
          path: 'mi-empresa',
          name: 'mi-empresa',
          component: () => import('@/views/members/MyCompanyView.vue'),
          meta: {
            roles: ['SOCIO'],
          },
        },
        {
          path: 'mis-ofertas',
          name: 'mis-ofertas',
          component: () => import('@/views/offers/MyOffersView.vue'),
          meta: {
            roles: ['SOCIO'],
          },
        },
        {
          path: 'mis-ofertas/nueva',
          name: 'mis-ofertas-nueva',
          component: () => import('@/views/offers/OfferFormView.vue'),
          meta: {
            roles: ['SOCIO'],
          },
        },
        {
          path: 'mis-ofertas/:id(\\d+)/editar',
          name: 'mis-ofertas-editar',
          component: () => import('@/views/offers/OfferFormView.vue'),
          meta: {
            roles: ['SOCIO'],
          },
        },
        {
          path: 'postulaciones-recibidas',
          name: 'postulaciones-recibidas',
          component: () =>
            import('@/views/applications/ReceivedApplicationsView.vue'),
          meta: {
            roles: ['SOCIO'],
          },
        },
        {
          path: 'notificaciones',
          name: 'notificaciones',
          component: () =>
            import('@/views/notifications/NotificationsView.vue'),
        },
        {
          // Para todos los roles: datos de acceso y cambio de contraseña.
          path: 'mi-cuenta',
          name: 'mi-cuenta',
          component: () => import('@/views/account/MyAccountView.vue'),
        },

        {
          path: 'cuotas',
          name: 'cuotas',
          component: () => import('@/views/fees/FeesView.vue'),
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

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (to.path !== '/login') {
    await auth.initialize();
  }

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
