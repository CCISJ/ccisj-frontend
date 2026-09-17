import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import { setUnauthorizedHandler } from './services/api';
import { useAuthStore } from './stores/auth';
import { useNotificationsStore } from './stores/notifications';

import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Si el backend rechaza la sesión en medio del uso, se vuelve al login con un
// aviso en vez de dejar la pantalla llena de errores. Al volver a entrar se
// retoma la página donde estaba.
setUnauthorizedHandler(() => {
  const auth = useAuthStore(pinia);

  if (!auth.user) return;

  auth.user = null;
  useNotificationsStore(pinia).clear();

  const current = router.currentRoute.value;

  router.replace({
    name: 'login',
    query: {
      sesion: 'vencida',
      ...(current.name !== 'login' && { volver: current.fullPath }),
    },
  });
});

app.mount('#app');
