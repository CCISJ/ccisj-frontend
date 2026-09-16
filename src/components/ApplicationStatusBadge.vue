<script setup lang="ts">
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from '@/types/application.type';

defineProps<{
  status: ApplicationStatus;
}>();

const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  ENVIADA: 'bg-sky-50 text-sky-700',
  EN_REVISION: 'bg-amber-50 text-amber-700',
  SELECCIONADO: 'bg-emerald-50 text-emerald-700',
  NO_SELECCIONADO: 'bg-slate-100 text-slate-500',
  FINALIZADA: 'bg-slate-100 text-slate-500',
};
</script>

<template>
  <span
    class="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
    :class="STATUS_CLASSES[status]"
  >
    {{ APPLICATION_STATUS_LABELS[status] }}
  </span>
</template>
