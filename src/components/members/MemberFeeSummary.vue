<script setup lang="ts">
import { computed } from 'vue';

import type { MemberFeeSummary } from '@/types/fee.type';

import { formatMoney } from '@/utils/money';

const props = defineProps<{
  summary: MemberFeeSummary | null;
}>();

/**
 * Una sola línea con lo que importa: si está al día o cuánto debe en total,
 * el mismo número que la lista de socios. Debajo, de qué se compone: lo
 * vencido y lo que todavía no venció.
 */
const detail = computed(() => {
  const s = props.summary;

  if (!s) return '';

  const porVencer = s.cuotasPendientes - s.cuotasVencidas;
  const parts: string[] = [];

  if (s.cuotasVencidas > 0) {
    parts.push(
      s.cuotasVencidas === 1
        ? 'Una cuota vencida'
        : `${s.cuotasVencidas} cuotas vencidas`,
    );
  }

  if (porVencer > 0) {
    parts.push(
      porVencer === 1
        ? `una por vencer (${formatMoney(s.deudaTotal - s.deudaVencida)})`
        : `${porVencer} por vencer (${formatMoney(s.deudaTotal - s.deudaVencida)})`,
    );
  }

  const text = parts.join(' y ');

  return text.charAt(0).toUpperCase() + text.slice(1);
});
</script>

<template>
  <section
    class="rounded-xl border bg-white px-5 py-4"
    :class="
      summary && summary.cuotasVencidas > 0
        ? 'border-red-200'
        : 'border-slate-200'
    "
    aria-label="Estado de cuenta"
  >
    <template v-if="summary">
      <p class="text-sm text-slate-600">Estado de cuenta</p>

      <p
        class="text-xl font-bold"
        :class="summary.cuotasVencidas > 0 ? 'text-red-700' : 'text-ccisj'"
      >
        <!-- Igual que la lista de socios: al día mientras nada esté vencido. -->
        {{
          summary.cuotasVencidas > 0
            ? `Debe ${formatMoney(summary.deudaTotal)}`
            : 'Al día'
        }}
      </p>

      <p v-if="detail" class="mt-0.5 text-base text-slate-700">
        {{ detail }}
      </p>
    </template>

    <p v-else class="text-base text-slate-600">
      No hay información de cuotas para este socio.
    </p>
  </section>
</template>
