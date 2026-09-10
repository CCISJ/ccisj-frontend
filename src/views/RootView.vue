<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import AdminLayout from '@/layouts/AdminLayout.vue';
import MemberLayout from '@/layouts/MemberLayout.vue';
import ApplicantLayout from '@/layouts/ApplicantLayout.vue';
import AppToast from '@/components/ui/AppToast.vue';

const auth = useAuthStore();

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
  <AppToast />
</template>
