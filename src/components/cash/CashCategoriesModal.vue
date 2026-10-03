<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Plus, Trash2 } from 'lucide-vue-next';

import BaseModal from '@/components/BaseModal.vue';

import {
  createCashCategory,
  deactivateCashCategory,
  getCashCategories,
} from '@/services/cashService';

import { useToastStore } from '@/stores/toast';

import type { CashCategory, CashMovementType } from '@/types/cash.type';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const toast = useToastStore();

const categories = ref<CashCategory[]>([]);
const loading = ref(false);
const saving = ref(false);
const deletingId = ref<number | null>(null);

const nombre = ref('');
const tipo = ref<CashMovementType>('INGRESO');

const incomeCategories = computed(() =>
  categories.value.filter(
    (category) => category.tipo === 'INGRESO' && category.activa,
  ),
);

const expenseCategories = computed(() =>
  categories.value.filter(
    (category) => category.tipo === 'EGRESO' && category.activa,
  ),
);

function isReserved(category: CashCategory) {
  return category.tipo === 'INGRESO' && category.nombre === 'Cuotas de socios';
}

async function loadCategories() {
  try {
    loading.value = true;
    categories.value = await getCashCategories();
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudieron cargar las categorías.',
    );
  } finally {
    loading.value = false;
  }
}

async function addCategory() {
  if (!nombre.value.trim()) {
    toast.error('Ingresá un nombre para la categoría.');
    return;
  }

  try {
    saving.value = true;

    await createCashCategory({
      nombre: nombre.value.trim(),
      tipo: tipo.value,
    });

    nombre.value = '';

    await loadCategories();
    emit('updated');

    toast.success('Categoría creada correctamente.');
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo crear la categoría.',
    );
  } finally {
    saving.value = false;
  }
}

async function deactivateCategory(category: CashCategory) {
  if (isReserved(category)) return;

  try {
    deletingId.value = category.id;

    await deactivateCashCategory(category.id);
    await loadCategories();

    emit('updated');

    toast.success('Categoría desactivada.');
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudo desactivar la categoría.',
    );
  } finally {
    deletingId.value = null;
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      loadCategories();
    }
  },
);
</script>

<template>
  <template>
    <BaseModal
      :open="open"
      title="Gestionar categorías"
      @close="emit('close')"
      maxWidth="xl"
    >
      <div class="space-y-6 p-6">
        <!-- Nueva categoría -->
        <section>
          <h3 class="mb-3 text-sm font-semibold text-slate-800">
            Nueva categoría
          </h3>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-500">
                Tipo
              </label>

              <select
                v-model="tipo"
                class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-ccisj"
              >
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-medium text-slate-500">
                Nombre
              </label>

              <input
                v-model="nombre"
                type="text"
                maxlength="100"
                placeholder="Ej. Alquiler de salón"
                class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-ccisj"
                @keyup.enter="addCategory"
              />
            </div>
          </div>

          <div class="mt-3 flex justify-end">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg bg-ccisj px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
              :disabled="saving"
              @click="addCategory"
            >
              <Plus class="h-4 w-4" />
              {{ saving ? 'Agregando...' : 'Agregar categoría' }}
            </button>
          </div>
        </section>

        <div class="border-t border-slate-100" />

        <div v-if="loading" class="py-8 text-center text-sm text-slate-400">
          Cargando categorías...
        </div>

        <template v-else>
          <!-- Ingresos -->
          <section>
            <div class="mb-3 flex items-center gap-2">
              <div class="h-2.5 w-2.5 rounded-full bg-emerald-500" />

              <h3 class="text-sm font-semibold text-slate-800">Ingresos</h3>

              <span class="text-xs text-slate-400">
                {{ incomeCategories.length }}
              </span>
            </div>

            <div
              v-if="incomeCategories.length === 0"
              class="rounded-lg bg-slate-50 px-4 py-5 text-center text-sm text-slate-400"
            >
              No hay categorías de ingresos.
            </div>

            <div v-else class="space-y-1">
              <div
                v-for="category in incomeCategories"
                :key="category.id"
                class="flex min-h-11 items-center justify-between rounded-lg px-3 transition hover:bg-slate-50"
              >
                <span class="text-sm text-slate-700">
                  {{ category.nombre }}
                </span>

                <span
                  v-if="isReserved(category)"
                  class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                >
                  Reservada
                </span>

                <button
                  v-else
                  type="button"
                  class="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="Desactivar categoría"
                  :disabled="deletingId === category.id"
                  @click="deactivateCategory(category)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <!-- Egresos -->
          <section>
            <div class="mb-3 flex items-center gap-2">
              <div class="h-2.5 w-2.5 rounded-full bg-red-500" />

              <h3 class="text-sm font-semibold text-slate-800">Egresos</h3>

              <span class="text-xs text-slate-400">
                {{ expenseCategories.length }}
              </span>
            </div>

            <div
              v-if="expenseCategories.length === 0"
              class="rounded-lg bg-slate-50 px-4 py-5 text-center text-sm text-slate-400"
            >
              No hay categorías de egresos.
            </div>

            <div v-else class="space-y-1">
              <div
                v-for="category in expenseCategories"
                :key="category.id"
                class="flex min-h-11 items-center justify-between rounded-lg px-3 transition hover:bg-slate-50"
              >
                <span class="text-sm text-slate-700">
                  {{ category.nombre }}
                </span>

                <button
                  type="button"
                  class="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="Desactivar categoría"
                  :disabled="deletingId === category.id"
                  @click="deactivateCategory(category)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </template>
      </div>
    </BaseModal>
  </template>
</template>
