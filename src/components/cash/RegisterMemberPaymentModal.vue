<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { feesService } from '@/services/feesService';
import { getMembers, isFullMember } from '@/services/membersService';

import { useToastStore } from '@/stores/toast';

import type { MemberFeeSummary } from '@/types/fee.type';
import type { Member } from '@/types/member.type';

import BaseModal from '../BaseModal.vue';

type Props = {
  open: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  created: [];
}>();

const toast = useToastStore();

const members = ref<Member[]>([]);
const selectedMemberId = ref<number | null>(null);
const feeSummary = ref<MemberFeeSummary | null>(null);

const importe = ref<number | null>(null);
const fechaPago = ref(todayLocal());
const medioPago = ref('EFECTIVO');
const comprobanteUrl = ref('');
const observaciones = ref('');

const loadingMembers = ref(false);
const loadingSummary = ref(false);
const submitting = ref(false);

const selectedMember = computed(() =>
  members.value.find((member) => member.id === selectedMemberId.value),
);

function todayLocal() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

async function loadMembers() {
  loadingMembers.value = true;

  try {
    const data = await getMembers();

    members.value = data
      .filter(isFullMember)
      .filter((member) => member.usuario.activo)
      .sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudieron cargar los socios',
    );
  } finally {
    loadingMembers.value = false;
  }
}

async function loadFeeSummary() {
  feeSummary.value = null;

  if (!selectedMemberId.value) return;

  loadingSummary.value = true;

  try {
    feeSummary.value = await feesService.getMemberFeeSummary(
      selectedMemberId.value,
    );
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudo cargar el estado de cuenta',
    );
  } finally {
    loadingSummary.value = false;
  }
}

function resetForm() {
  selectedMemberId.value = null;
  feeSummary.value = null;
  importe.value = null;
  fechaPago.value = todayLocal();
  medioPago.value = 'EFECTIVO';
  comprobanteUrl.value = '';
  observaciones.value = '';
}

function close() {
  if (submitting.value) return;

  resetForm();
  emit('close');
}

async function submit() {
  if (!selectedMemberId.value) {
    toast.error('Seleccioná un socio');
    return;
  }

  if (!importe.value || importe.value <= 0) {
    toast.error('Ingresá un importe válido');
    return;
  }

  if (medioPago.value === 'TARJETA' && !comprobanteUrl.value.trim()) {
    toast.error('El comprobante es obligatorio para pagos con tarjeta');
    return;
  }

  submitting.value = true;

  try {
    await feesService.createPayment(selectedMemberId.value, {
      importe: importe.value,
      fechaPago: fechaPago.value,
      medioPago: medioPago.value,
      comprobanteUrl: comprobanteUrl.value.trim() || undefined,
      observaciones: observaciones.value.trim() || undefined,
    });

    toast.success('Pago registrado correctamente');

    resetForm();
    emit('created');
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo registrar el pago',
    );
  } finally {
    submitting.value = false;
  }
}

watch(selectedMemberId, loadFeeSummary);

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm();
      loadMembers();
    }
  },
);
</script>

<template>
  <BaseModal
    :open="open"
    title="Registrar pago de socio"
    max-width="lg"
    @close="close"
  >
    <form class="space-y-5 p-6" @submit.prevent="submit">
      <!-- Socio -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700">
          Socio
        </label>

        <select
          v-model="selectedMemberId"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-ccisj"
          :disabled="loadingMembers"
          required
        >
          <option :value="null" disabled>
            {{ loadingMembers ? 'Cargando socios...' : 'Seleccionar socio' }}
          </option>

          <option v-for="member in members" :key="member.id" :value="member.id">
            {{ member.razonSocial }}
          </option>
        </select>
      </div>

      <!-- Estado de cuenta -->
      <div
        v-if="selectedMemberId"
        class="rounded-xl border border-slate-200 bg-slate-50 p-4"
      >
        <div
          v-if="loadingSummary"
          class="py-3 text-center text-sm text-slate-400"
        >
          Cargando estado de cuenta...
        </div>

        <template v-else-if="feeSummary">
          <div class="mb-3">
            <p class="text-sm font-semibold text-slate-800">
              {{ selectedMember?.razonSocial }}
            </p>

            <p class="mt-0.5 text-xs text-slate-400">
              Estado actual de la cuenta
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-white p-3">
              <p class="text-xs text-slate-500">Cuotas pendientes</p>

              <p class="mt-1 text-lg font-bold text-slate-900">
                {{ feeSummary.cuotasPendientes }}
              </p>
            </div>

            <div class="rounded-lg bg-white p-3">
              <p class="text-xs text-slate-500">Deuda total</p>

              <p class="mt-1 text-lg font-bold text-slate-900">
                ${{ feeSummary.deudaTotal.toLocaleString('es-UY') }}
              </p>
            </div>
          </div>
        </template>
      </div>

      <!-- Importe y fecha -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            Importe
          </label>

          <div class="relative">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
            >
              $
            </span>

            <input
              v-model.number="importe"
              type="number"
              min="0.01"
              step="0.01"
              class="w-full rounded-lg border border-slate-200 py-2.5 pl-7 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-ccisj"
              placeholder="0"
              required
            />
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            Fecha
          </label>

          <input
            v-model="fechaPago"
            type="date"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-ccisj"
            required
          />
        </div>
      </div>

      <!-- Medio de pago -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700">
          Medio de pago
        </label>

        <select
          v-model="medioPago"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-ccisj"
        >
          <option value="EFECTIVO">Efectivo</option>

          <option value="TARJETA">Tarjeta</option>
        </select>
      </div>

      <!-- Comprobante -->
      <div v-if="medioPago === 'TARJETA'">
        <label class="mb-1.5 block text-sm font-medium text-slate-700">
          Comprobante
        </label>

        <input
          v-model="comprobanteUrl"
          type="text"
          class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-ccisj"
          placeholder="URL del comprobante"
          required
        />

        <p class="mt-1.5 text-xs text-slate-400">
          El comprobante es obligatorio para pagos con tarjeta.
        </p>
      </div>

      <!-- Observaciones -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700">
          Observaciones
          <span class="font-normal text-slate-400">(opcional)</span>
        </label>

        <textarea
          v-model="observaciones"
          rows="3"
          maxlength="500"
          class="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-ccisj"
          placeholder="Información adicional sobre el pago"
        />
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          :disabled="submitting"
          @click="close"
        >
          Cancelar
        </button>

        <button
          type="submit"
          class="rounded-lg bg-ccisj px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
          :disabled="
            submitting || !selectedMemberId || loadingSummary || !feeSummary
          "
        >
          {{ submitting ? 'Registrando...' : 'Registrar pago' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
