<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { useNotificationsStore } from '@/stores/notifications';

import AdminLayout from '@/layouts/AdminLayout.vue';
import MemberLayout from '@/layouts/MemberLayout.vue';
import ApplicantLayout from '@/layouts/ApplicantLayout.vue';

import AppToast from '@/components/AppToast.vue';
import EmergentNotificationModal from '@/components/EmergentNotificationModal.vue';

const auth = useAuthStore();
const toast = useToastStore();
const notificationsStore = useNotificationsStore();

const { pendingPopups } = storeToRefs(notificationsStore);

const currentPopup = computed(() => pendingPopups.value[0] ?? null);
const popupVisible = ref(true);

async function closeCurrentPopup() {
  if (!currentPopup.value) return;

  try {
    popupVisible.value = false;

    await new Promise((resolve) => setTimeout(resolve, 180));

    await notificationsStore.markPopupAsSeen(currentPopup.value);

    if (pendingPopups.value.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 120));

      popupVisible.value = true;
    }
  } catch (error) {
    popupVisible.value = true;

    toast.error(
      error instanceof Error
        ? error.message
        : 'No se pudo cerrar la notificación',
    );
  }
}

onMounted(async () => {
  if (auth.isAdmin) return;

  try {
    await notificationsStore.fetchPendingPopups();
  } catch {
    // Si falla, dejamos que la aplicación cargue igual.
  }
});

const layout = computed(() => {
  switch (auth.role) {
    case 'ADMIN':
      return AdminLayout;

    case 'SOCIO':
      return MemberLayout;

    case 'POSTULANTE':
      return ApplicantLayout;

    default:
      return null;
  }
});
</script>

<template>
  <component v-if="layout" :is="layout" />

  <EmergentNotificationModal
    v-if="currentPopup"
    :open="popupVisible"
    :title="currentPopup.notificacion.titulo"
    :message="currentPopup.notificacion.mensaje"
    @close="closeCurrentPopup"
  />

  <AppToast />
</template>
