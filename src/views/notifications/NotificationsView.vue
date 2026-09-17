<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

import AdminNotificationsView from './AdminNotificationsView.vue';
import UserNotificationsView from './UserNotificationsView.vue';

const auth = useAuthStore();
</script>

<template>
  <AdminNotificationsView v-if="auth.isAdmin" />
  <UserNotificationsView v-else />
</template>
