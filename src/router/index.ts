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
      name: 'home',
      component: () => import('@/views/RootView.vue'),
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
});

export default router;
