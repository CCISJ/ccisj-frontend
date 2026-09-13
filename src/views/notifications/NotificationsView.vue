<script setup lang="ts">
import AdminNotificationsView from './AdminNotificationsView.vue';
import UserNotificationsView from './UserNotificationsView.vue';

import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <AdminNotificationsView v-if="auth.isAdmin" />
  <UserNotificationsView v-else />
</template>
