<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { RouterLink } from 'vue-router';

import { ArrowRight, RefreshCw } from 'lucide-vue-next';

import { getSummary } from '@/services/cashService';
import { feesService } from '@/services/feesService';
import { getMembers, isFullMember } from '@/services/membersService';

import type { CashSummary } from '@/types/cash.type';
import type { FeesDashboardSummary, RecentFeePayment } from '@/types/fee.type';
import type { Member } from '@/types/member.type';

import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';

/** Cuántos socios con deuda se listan en el inicio; el resto, en Cuotas. */
const DEBTORS_SHOWN = 6;

const cash = ref<CashSummary | null>(null);
const fees = ref<FeesDashboardSummary | null>(null);
const payments = ref<RecentFeePayment[]>([]);
const members = ref<Member[]>([]);

const loading = ref(false);
const cashError = ref(false);
const feesError = ref(false);
const paymentsError = ref(false);
const membersError = ref(false);

const monthLabel = computed(() => {
  const label = new Intl.DateTimeFormat('es-UY', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Montevideo',
  }).format(new Date());

  return label.charAt(0).toUpperCase() + label.slice(1);
});

function money(value: number | undefined) {
  return value === undefined ? '—' : formatMoney(value);
}

/** Los que tienen cuotas vencidas, de mayor a menor deuda. */
const debtors = computed(() =>
  members.value
    .filter(
      (member) =>
        member.usuario.activo &&
        member.estadoCuotas &&
        member.estadoCuotas.estado !== 'AL_DIA',
    )
    .sort(
      (a, b) =>
        (b.estadoCuotas?.deudaTotal ?? 0) - (a.estadoCuotas?.deudaTotal ?? 0),
    ),
);

const shownDebtors = computed(() => debtors.value.slice(0, DEBTORS_SHOWN));

/** Proporción al día / pendientes / deudores, para la barra. */
const split = computed(() => {
  if (!fees.value) return null;

  const { sociosAlDia, sociosPendientes, sociosDeudores } = fees.value;
  const total = sociosAlDia + sociosPendientes + sociosDeudores;

  return total > 0
    ? { total, sociosAlDia, sociosPendientes, sociosDeudores }
    : null;
});

async function loadDashboard() {
  loading.value = true;

  const [cashResult, feesResult, paymentsResult, membersResult] =
    await Promise.allSettled([
      getSummary(),
      feesService.getDashboardSummary(),
      feesService.getRecentPayments(),
      getMembers(),
    ]);

  cash.value = cashResult.status === 'fulfilled' ? cashResult.value : null;
  cashError.value = cashResult.status === 'rejected';

  fees.value = feesResult.status === 'fulfilled' ? feesResult.value : null;
  feesError.value = feesResult.status === 'rejected';

  payments.value =
    paymentsResult.status === 'fulfilled' ? paymentsResult.value : [];
  paymentsError.value = paymentsResult.status === 'rejected';

  members.value =
    membersResult.status === 'fulfilled'
      ? membersResult.value.filter(isFullMember)
      : [];
  membersError.value = membersResult.status === 'rejected';

  loading.value = false;
}

const tasks = [
  { label: 'Agregar un socio', to: '/socios/nuevo', primary: true },
  { label: 'Anotar un ingreso o un gasto en la caja', to: '/caja' },
  { label: 'Mandar un aviso a los socios', to: '/notificaciones' },
];

onMounted(loadDashboard);
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-8 pb-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Inicio</h1>
        <p class="mt-2 text-slate-600">
          Cómo viene el mes y qué hay para atender.
        </p>
      </div>

      <button
        type="button"
        :disabled="loading"
        class="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        @click="loadDashboard"
      >
        <RefreshCw class="h-5 w-5" :class="{ 'animate-spin': loading }" />
        Actualizar
      </button>
    </header>

    <!-- El mes en cuatro cifras -->
    <section
      aria-labelledby="mes"
      class="rounded-2xl border border-slate-200 bg-white"
    >
      <h2
        id="mes"
        class="border-b border-slate-200 px-6 py-4 font-bold text-slate-900"
      >
        {{ monthLabel }}
      </h2>

      <dl class="grid sm:grid-cols-2 xl:grid-cols-4">
        <div class="border-slate-100 px-6 py-5 sm:border-r">
          <dt class="text-slate-600">Cobrado en cuotas</dt>
          <dd class="mt-1 text-3xl font-bold tabular-nums text-slate-900">
            {{ money(fees?.cobradoMes) }}
          </dd>
          <dd class="mt-1 text-sm text-slate-600">
            {{ feesError ? 'No se pudo cargar' : 'Pagos registrados este mes' }}
          </dd>
        </div>

        <div class="border-slate-100 px-6 py-5 xl:border-r">
          <dt class="text-slate-600">Ingresos de caja</dt>
          <dd class="mt-1 text-3xl font-bold tabular-nums text-slate-900">
            {{ money(cash?.ingresos) }}
          </dd>
          <dd class="mt-1 text-sm text-slate-600">
            {{
              cashError
                ? 'No se pudo cargar'
                : `Egresos: ${money(cash?.egresos)}`
            }}
          </dd>
        </div>

        <div class="border-slate-100 px-6 py-5 sm:border-r">
          <dt class="text-slate-600">Balance de caja</dt>
          <dd
            class="mt-1 text-3xl font-bold tabular-nums"
            :class="
              cash && cash.balance < 0 ? 'text-red-700' : 'text-slate-900'
            "
          >
            {{ money(cash?.balance) }}
          </dd>
          <dd class="mt-1 text-sm text-slate-600">
            {{ cashError ? 'No se pudo cargar' : 'Ingresos menos egresos' }}
          </dd>
        </div>

        <div class="px-6 py-5">
          <dt class="text-slate-600">Deuda de los socios</dt>
          <dd
            class="mt-1 text-3xl font-bold tabular-nums"
            :class="
              fees && fees.deudaTotal > 0 ? 'text-red-700' : 'text-slate-900'
            "
          >
            {{ money(fees?.deudaTotal) }}
          </dd>
          <dd class="mt-1 text-sm text-slate-600">
            {{
              feesError
                ? 'No se pudo cargar'
                : `Vencida, de ${(fees?.sociosPendientes ?? 0) + (fees?.sociosDeudores ?? 0)} socios`
            }}
          </dd>
        </div>
      </dl>
    </section>

    <div class="grid items-start gap-6 xl:grid-cols-5">
      <!-- Lo que hay que atender -->
      <section
        aria-labelledby="deudas"
        class="min-w-0 rounded-2xl border border-slate-200 bg-white xl:col-span-3"
      >
        <div
          class="flex flex-wrap items-baseline justify-between gap-2 px-6 pt-5"
        >
          <h2 id="deudas" class="text-xl font-bold text-slate-900">
            Socios con cuotas vencidas
          </h2>

          <RouterLink
            to="/socios"
            class="font-semibold text-ccisj hover:underline"
          >
            Ver todos en Socios
          </RouterLink>
        </div>

        <div v-if="split" class="px-6 pt-4">
          <div
            role="img"
            :aria-label="`De ${split.total} socios activos, ${split.sociosAlDia} al día, ${split.sociosPendientes} con 1 o 2 cuotas vencidas y ${split.sociosDeudores} con 3 o más`"
            class="flex h-3 overflow-hidden rounded-full bg-slate-100"
          >
            <span
              class="bg-ccisj-brand"
              :style="{ flexGrow: split.sociosAlDia }"
            />
            <span
              class="bg-amber-500"
              :style="{ flexGrow: split.sociosPendientes }"
            />
            <span
              class="bg-red-700"
              :style="{ flexGrow: split.sociosDeudores }"
            />
          </div>

          <p class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
            <span>
              <strong class="text-slate-900">{{ split.sociosAlDia }}</strong>
              al día
            </span>
            <span>
              <strong class="text-slate-900">{{
                split.sociosPendientes
              }}</strong>
              con 1 o 2 vencidas
            </span>
            <span>
              <strong class="text-red-700">{{ split.sociosDeudores }}</strong>
              con 3 o más
            </span>
          </p>
        </div>

        <p v-if="membersError" class="px-6 py-6 text-red-700">
          No se pudo cargar la lista de socios.
        </p>

        <p
          v-else-if="!loading && debtors.length === 0"
          class="px-6 py-6 text-slate-600"
        >
          Ningún socio tiene cuotas vencidas.
        </p>

        <div v-else class="relative mt-4 overflow-x-auto">
          <table class="w-full min-w-[32rem] text-left">
            <thead class="text-sm text-slate-600">
              <tr class="border-y border-slate-200 bg-slate-50">
                <th scope="col" class="px-6 py-3 font-semibold">Socio</th>
                <th scope="col" class="px-4 py-3 font-semibold">Vencidas</th>
                <th scope="col" class="px-4 py-3 text-right font-semibold">
                  Debe
                </th>
                <th scope="col" class="px-6 py-3">
                  <span class="sr-only">Acción</span>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="member in shownDebtors"
                :key="member.id"
                class="border-b border-slate-100 last:border-0"
              >
                <td class="px-6 py-3 font-semibold text-slate-900">
                  {{ member.razonSocial }}
                </td>
                <td class="px-4 py-3">
                  {{ member.estadoCuotas?.cuotasVencidas }}
                  {{
                    member.estadoCuotas?.cuotasVencidas === 1
                      ? 'cuota'
                      : 'cuotas'
                  }}
                </td>
                <td
                  class="px-4 py-3 text-right font-bold"
                  :class="
                    member.estadoCuotas?.estado === 'DEUDOR'
                      ? 'text-red-700'
                      : 'text-amber-800'
                  "
                >
                  {{ money(member.estadoCuotas?.deudaTotal) }}
                </td>
                <td class="px-6 py-3 text-right">
                  <RouterLink
                    :to="{ name: 'socio-detalle', params: { id: member.id } }"
                    class="font-semibold text-ccisj hover:underline"
                  >
                    Ver cuotas
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>

          <p
            v-if="debtors.length > shownDebtors.length"
            class="border-t border-slate-100 px-6 py-3 text-sm text-slate-600"
          >
            Los {{ shownDebtors.length }} que más deben, de
            {{ debtors.length }}.
          </p>
        </div>
      </section>

      <div class="min-w-0 space-y-6 xl:col-span-2">
        <section
          aria-labelledby="pagos"
          class="rounded-2xl border border-slate-200 bg-white px-6 py-5"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="pagos" class="text-xl font-bold text-slate-900">
              Últimos pagos de cuotas
            </h2>
            <RouterLink
              to="/cuotas"
              class="font-semibold text-ccisj hover:underline"
            >
              Ir a Cuotas
            </RouterLink>
          </div>

          <p v-if="paymentsError" class="mt-3 text-red-700">
            No se pudieron cargar los pagos.
          </p>

          <p
            v-else-if="!loading && payments.length === 0"
            class="mt-3 text-slate-600"
          >
            Todavía no hay pagos registrados.
          </p>

          <ul v-else class="mt-2">
            <li
              v-for="payment in payments"
              :key="payment.id"
              class="flex items-baseline justify-between gap-4 border-t border-slate-100 py-3 first:border-0"
            >
              <span class="min-w-0">
                <span class="block truncate font-semibold text-slate-900">
                  {{ payment.razonSocial }}
                </span>
                <span class="text-sm text-slate-600">
                  {{ formatDate(payment.fechaPago) }}
                </span>
              </span>
              <span class="font-bold tabular-nums text-slate-900">
                {{ money(payment.importe) }}
              </span>
            </li>
          </ul>
        </section>

        <section
          aria-labelledby="tareas"
          class="rounded-2xl border border-slate-200 bg-white px-6 py-5"
        >
          <h2 id="tareas" class="text-xl font-bold text-slate-900">
            ¿Qué querés hacer?
          </h2>

          <div class="mt-4 space-y-3">
            <RouterLink
              v-for="task in tasks"
              :key="task.to"
              :to="task.to"
              class="flex min-h-13 items-center justify-between gap-3 rounded-xl px-5 font-semibold transition"
              :class="
                task.primary
                  ? 'bg-ccisj text-white hover:bg-ccisj-dark'
                  : 'border border-slate-300 text-slate-900 hover:border-ccisj hover:text-ccisj'
              "
            >
              {{ task.label }}
              <ArrowRight class="h-5 w-5 shrink-0" />
            </RouterLink>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
