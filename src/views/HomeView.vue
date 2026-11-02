<script setup lang="ts">
import AdminDashboard from '@/views/admin/DashboardView.vue';
import ApplicantDashboard from '@/views/applicants/DashboardView.vue';
import MemberDashboard from '@/views/members/DashboardView.vue';

import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>

<template>
  <MemberDashboard v-if="auth.role === 'SOCIO'" />

  <ApplicantDashboard v-else-if="auth.role === 'POSTULANTE'" />

  <AdminDashboard v-else-if="auth.role === 'ADMIN'" />
</template>
