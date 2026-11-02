<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useRouter } from 'vue-router';

import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  Plus,
  ReceiptText,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-vue-next';

import { getSummary } from '@/services/cashService';
import { feesService } from '@/services/feesService';

import type { CashSummary } from '@/types/cash.type';
import type { FeesDashboardSummary, RecentFeePayment } from '@/types/fee.type';

const router = useRouter();

const cash = ref<CashSummary | null>(null);
const fees = ref<FeesDashboardSummary | null>(null);
const payments = ref<RecentFeePayment[]>([]);

const loading = ref(false);
const cashError = ref(false);
const feesError = ref(false);
const paymentsError = ref(false);

const moneyFormatter = new Intl.NumberFormat('es-UY', {
  style: 'currency',
  currency: 'UYU',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-UY', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Montevideo',
});

const monthLabel = computed(() =>
  new Intl.DateTimeFormat('es-UY', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Montevideo',
  }).format(new Date()),
);

function formatMoney(value: number | undefined): string {
  return value === undefined ? '—' : moneyFormatter.format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : dateFormatter.format(date);
}

async function loadDashboard() {
  loading.value = true;
  cashError.value = false;
  feesError.value = false;
  paymentsError.value = false;

  const [cashResult, feesResult, paymentsResult] = await Promise.allSettled([
    getSummary(),
    feesService.getDashboardSummary(),
    feesService.getRecentPayments(),
  ]);

  if (cashResult.status === 'fulfilled') {
    cash.value = cashResult.value;
  } else {
    cash.value = null;
    cashError.value = true;
  }

  if (feesResult.status === 'fulfilled') {
    fees.value = feesResult.value;
  } else {
    fees.value = null;
    feesError.value = true;
  }

  if (paymentsResult.status === 'fulfilled') {
    payments.value = paymentsResult.value;
  } else {
    payments.value = [];
    paymentsError.value = true;
  }

  loading.value = false;
}

const shortcuts = [
  {
    label: 'Agregar socio',
    description: 'Registrar una nueva empresa',
    icon: Plus,
    to: '/socios/nuevo',
  },
  {
    label: 'Consultar socios',
    description: 'Buscar empresas registradas',
    icon: Users,
    to: '/socios',
  },
  {
    label: 'Administrar cuotas',
    description: 'Consultar y registrar pagos',
    icon: ReceiptText,
    to: '/cuotas',
  },
  {
    label: 'Administrar Caja',
    description: 'Ingresos, egresos y movimientos',
    icon: Wallet,
    to: '/caja',
  },
];

onMounted(loadDashboard);
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-7 pb-8">
    <!-- Encabezado -->
    <header
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <span
          class="inline-flex rounded-full bg-ccisj-light px-3 py-1 text-xs font-semibold text-ccisj ring-1 ring-emerald-100"
        >
          Backoffice CCISJ
        </span>

        <h1
          class="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          Panel de administración
        </h1>

        <p class="mt-1 text-sm text-slate-500">
          Resumen de la gestión del Centro Comercial e Industrial de San José.
        </p>
      </div>

      <button
        type="button"
        :disabled="loading"
        class="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        @click="loadDashboard"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        Actualizar
      </button>
    </header>

    <!-- Estadísticas -->
    <section>
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-base font-semibold text-slate-900">
            Resumen general
          </h2>
          <p class="mt-1 text-xs capitalize text-slate-500">
            {{ monthLabel }}
          </p>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <!-- Cobrado en cuotas -->
        <article class="rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500"> Cobrado en cuotas </span>
            <span class="rounded-lg bg-emerald-50 p-2 text-ccisj">
              <ReceiptText class="h-5 w-5" />
            </span>
          </div>

          <p class="mt-4 text-2xl font-bold text-slate-900">
            {{ formatMoney(fees?.cobradoMes) }}
          </p>

          <p class="mt-2 text-xs text-slate-500">
            {{ feesError ? 'No se pudo cargar' : 'Durante este mes' }}
          </p>
        </article>

        <!-- Deuda total -->
        <article class="rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500"> Deuda total </span>
            <span class="rounded-lg bg-amber-50 p-2 text-amber-600">
              <CircleAlert class="h-5 w-5" />
            </span>
          </div>

          <p class="mt-4 text-2xl font-bold text-slate-900">
            {{ formatMoney(fees?.deudaTotal) }}
          </p>

          <p class="mt-2 text-xs text-slate-500">
            {{ feesError ? 'No se pudo cargar' : 'Deuda acumulada de socios' }}
          </p>
        </article>

        <!-- Ingresos de caja -->
        <article class="rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500"> Ingresos de Caja </span>
            <span class="rounded-lg bg-blue-50 p-2 text-blue-600">
              <TrendingUp class="h-5 w-5" />
            </span>
          </div>

          <p class="mt-4 text-2xl font-bold text-slate-900">
            {{ formatMoney(cash?.ingresos) }}
          </p>

          <p class="mt-2 text-xs text-slate-500">
            {{ cashError ? 'No se pudo cargar' : 'Durante este mes' }}
          </p>
        </article>

        <!-- Balance -->
        <article class="rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-500"> Balance de Caja </span>
            <span class="rounded-lg bg-violet-50 p-2 text-violet-600">
              <Wallet class="h-5 w-5" />
            </span>
          </div>

          <p
            class="mt-4 text-2xl font-bold"
            :class="
              cash && cash.balance < 0 ? 'text-red-600' : 'text-slate-900'
            "
          >
            {{ formatMoney(cash?.balance) }}
          </p>

          <p class="mt-2 text-xs text-slate-500">
            {{
              cashError ? 'No se pudo cargar' : 'Ingresos menos egresos del mes'
            }}
          </p>
        </article>
      </div>
    </section>

    <!-- Estado de socios + accesos -->
    <div class="grid gap-5 lg:grid-cols-3">
      <section
        class="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2"
      >
        <div class="flex items-center gap-2">
          <Users class="h-5 w-5 text-ccisj" />
          <h2 class="font-semibold text-slate-900">
            Estado de cuotas de los socios
          </h2>
        </div>

        <p class="mt-1 text-sm text-slate-500">
          Situación general de los socios respecto a sus cuotas.
        </p>

        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-emerald-50 p-4">
            <CheckCircle2 class="h-5 w-5 text-emerald-600" />
            <p class="mt-3 text-2xl font-bold text-slate-900">
              {{ fees?.sociosAlDia ?? '—' }}
            </p>
            <p class="mt-1 text-sm text-slate-600">Al día</p>
          </div>

          <div class="rounded-xl bg-amber-50 p-4">
            <Clock3 class="h-5 w-5 text-amber-600" />
            <p class="mt-3 text-2xl font-bold text-slate-900">
              {{ fees?.sociosPendientes ?? '—' }}
            </p>
            <p class="mt-1 text-sm text-slate-600">Pendientes</p>
          </div>

          <div class="rounded-xl bg-red-50 p-4">
            <CircleAlert class="h-5 w-5 text-red-600" />
            <p class="mt-3 text-2xl font-bold text-slate-900">
              {{ fees?.sociosDeudores ?? '—' }}
            </p>
            <p class="mt-1 text-sm text-slate-600">Deudores</p>
          </div>
        </div>

        <p v-if="feesError" class="mt-4 text-sm text-red-600">
          No se pudo consultar el estado de las cuotas.
        </p>

        <button
          type="button"
          class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ccisj hover:underline"
          @click="router.push('/cuotas')"
        >
          Ver gestión de cuotas
          <ArrowRight class="h-4 w-4" />
        </button>
      </section>

      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <h2 class="font-semibold text-slate-900">Accesos rápidos</h2>

        <p class="mt-1 text-sm text-slate-500">Operaciones frecuentes.</p>

        <div class="mt-4 space-y-2">
          <button
            v-for="shortcut in shortcuts"
            :key="shortcut.to"
            type="button"
            class="group flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/50"
            @click="router.push(shortcut.to)"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ccisj-light text-ccisj"
            >
              <component :is="shortcut.icon" class="h-4 w-4" />
            </span>

            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-slate-800">
                {{ shortcut.label }}
              </span>
              <span class="block text-xs text-slate-500">
                {{ shortcut.description }}
              </span>
            </span>

            <ArrowRight
              class="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1"
            />
          </button>
        </div>
      </section>
    </div>

    <!-- Pagos recientes -->
    <section class="rounded-xl border border-slate-200 bg-white">
      <div
        class="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 class="font-semibold text-slate-900">
            Últimos pagos registrados
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            Movimientos recientes de cuotas de socios.
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1 text-sm font-semibold text-ccisj hover:underline"
          @click="router.push('/cuotas')"
        >
          Ver cuotas
          <ArrowUpRight class="h-4 w-4" />
        </button>
      </div>

      <div
        v-if="loading && payments.length === 0"
        class="p-8 text-center text-sm text-slate-500"
      >
        Cargando pagos...
      </div>

      <div v-else-if="paymentsError" class="p-8 text-center">
        <CircleAlert class="mx-auto h-6 w-6 text-red-500" />
        <p class="mt-2 text-sm text-slate-600">
          No se pudieron cargar los últimos pagos.
        </p>
      </div>

      <div v-else-if="payments.length === 0" class="p-10 text-center">
        <CreditCard class="mx-auto h-8 w-8 text-slate-300" />
        <p class="mt-3 text-sm font-medium text-slate-700">
          No hay pagos recientes
        </p>
        <p class="mt-1 text-xs text-slate-500">
          Los próximos pagos registrados aparecerán acá.
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th class="px-5 py-3 font-medium">Socio</th>
              <th class="px-5 py-3 font-medium">Fecha</th>
              <th class="px-5 py-3 text-right font-medium">Importe</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="payment in payments.slice(0, 5)"
              :key="payment.id"
              class="hover:bg-slate-50"
            >
              <td class="px-5 py-4">
                <p class="font-semibold text-slate-800">
                  {{ payment.razonSocial }}
                </p>
                <p class="mt-0.5 text-xs text-slate-500">
                  Pago #{{ payment.id }}
                </p>
              </td>

              <td class="px-5 py-4 text-slate-600">
                <span class="inline-flex items-center gap-2">
                  <CalendarDays class="h-4 w-4 text-slate-400" />
                  {{ formatDate(payment.fechaPago) }}
                </span>
              </td>

              <td class="px-5 py-4 text-right font-semibold text-slate-900">
                {{ formatMoney(payment.importe) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
