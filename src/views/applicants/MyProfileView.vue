<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { RouterLink } from 'vue-router';

import {
  ChevronRight,
  FileUser,
  KeyRound,
  LoaderCircle,
  Save,
} from 'lucide-vue-next';

import CategoryPicker from '@/components/CategoryPicker.vue';

import {
  type ActiveCategory,
  getActiveCategories,
} from '@/services/categoriesService';
import { cvProgress, getMyCv, saveMyProfile } from '@/services/cvService';

import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

import type { Cv, ProfileData } from '@/types/cv.type';

const auth = useAuthStore();
const toast = useToastStore();

const loading = ref(true);
const loadError = ref('');
const saving = ref(false);
const cv = ref<Cv | null>(null);
const categories = ref<ActiveCategory[]>([]);

const form = reactive<ProfileData>({
  nombre: '',
  apellido: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
  categoriaIds: [],
});

function fill(data: Cv) {
  cv.value = data;

  Object.assign(form, {
    nombre: data.nombre,
    apellido: data.apellido,
    telefono: data.telefono ?? '',
    direccion: data.direccion ?? '',
    fechaNacimiento: data.fechaNacimiento?.slice(0, 10) ?? '',
    categoriaIds: data.categorias.map(({ categoria }) => categoria.id),
  });
}

async function load() {
  loading.value = true;
  loadError.value = '';

  try {
    const [data, active] = await Promise.all([
      getMyCv(),
      getActiveCategories().catch(() => []),
    ]);

    categories.value = active;
    fill(data);
  } catch (err) {
    loadError.value =
      err instanceof Error ? err.message : 'No se pudo cargar tu perfil';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function save() {
  if (saving.value) return;

  if (!form.nombre.trim() || !form.apellido.trim() || !form.telefono.trim()) {
    toast.error('Completá nombre, apellido y teléfono.');
    return;
  }

  saving.value = true;

  try {
    fill(await saveMyProfile(form));
    // El nombre del encabezado sale de la sesión.
    await auth.fetchMe();
    toast.success('Perfil guardado');
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'Error al guardar el perfil',
    );
  } finally {
    saving.value = false;
  }
}

/** Resumen del CV: qué tiene cargado cada sección. */
const cvSummary = computed(() => {
  if (!cv.value) return [];

  const count = (n: number, one: string, many: string) =>
    n === 0 ? 'Sin cargar' : `${n} ${n === 1 ? one : many}`;

  const studies = cv.value.estudios;

  return [
    {
      label: 'Estudios curriculares',
      value: count(
        studies.filter((s) => s.tipo === 'CURRICULAR').length,
        'estudio',
        'estudios',
      ),
    },
    {
      label: 'Estudios no curriculares',
      value: count(
        studies.filter((s) => s.tipo === 'NO_CURRICULAR').length,
        'curso',
        'cursos',
      ),
    },
    {
      label: 'Experiencia laboral',
      value: count(cv.value.experiencias.length, 'trabajo', 'trabajos'),
    },
    {
      label: 'Referencias',
      value: count(cv.value.referencias.length, 'referencia', 'referencias'),
    },
    {
      label: 'CV en PDF',
      value: count(cv.value.cvs.length, 'archivo', 'archivos'),
    },
  ];
});

const progress = computed(() => (cv.value ? cvProgress(cv.value) : 0));

const card = 'rounded-xl border border-slate-200 bg-white';
const cardHeader =
  'flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5';
const cardTitle = 'text-sm font-semibold text-slate-800';
const label = 'mb-1.5 block text-xs font-medium text-slate-600';
const input =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-ccisj focus:ring-2 focus:ring-emerald-100';
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Mi perfil</h1>

      <p class="mt-1 text-sm text-slate-500">
        Tus datos de contacto y los rubros de los que querés recibir ofertas.
      </p>
    </div>

    <p v-if="loading" class="py-10 text-center text-sm text-slate-400">
      Cargando...
    </p>

    <div
      v-else-if="loadError"
      class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      {{ loadError }}
      <button type="button" class="ml-2 font-medium underline" @click="load">
        Reintentar
      </button>
    </div>

    <div v-else class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div class="space-y-5 lg:col-span-2">
        <!-- Datos personales -->
        <section :class="card">
          <div :class="cardHeader">
            <h2 :class="cardTitle">Datos personales</h2>
          </div>

          <div class="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <label for="perfil-nombre" :class="label">Nombre</label>
              <input
                id="perfil-nombre"
                v-model="form.nombre"
                maxlength="100"
                :class="input"
              />
            </div>

            <div>
              <label for="perfil-apellido" :class="label">Apellidos</label>
              <input
                id="perfil-apellido"
                v-model="form.apellido"
                maxlength="100"
                :class="input"
              />
            </div>

            <div>
              <label for="perfil-telefono" :class="label">Teléfono</label>
              <input
                id="perfil-telefono"
                v-model="form.telefono"
                type="tel"
                maxlength="50"
                :class="input"
              />
            </div>

            <div>
              <label for="perfil-nacimiento" :class="label">
                Fecha de nacimiento
              </label>
              <input
                id="perfil-nacimiento"
                v-model="form.fechaNacimiento"
                type="date"
                :class="input"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="perfil-direccion" :class="label">Dirección</label>
              <input
                id="perfil-direccion"
                v-model="form.direccion"
                maxlength="255"
                placeholder="Calle, número y ciudad"
                :class="input"
              />
            </div>

            <div class="sm:col-span-2">
              <p :class="label">Correo electrónico</p>
              <p class="text-sm text-slate-700">{{ cv?.usuario.email }}</p>
            </div>
          </div>
        </section>

        <!-- Rubros -->
        <section v-if="categories.length > 0" :class="card">
          <div :class="cardHeader">
            <div>
              <h2 :class="cardTitle">Ofertas que me interesan</h2>
              <p class="text-xs text-slate-400">
                En Ofertas laborales vas a ver primero las de estos rubros.
              </p>
            </div>
          </div>

          <div class="p-5">
            <CategoryPicker
              v-model="form.categoriaIds"
              :categories="categories"
              :disabled="saving"
            />
          </div>
        </section>

        <div class="flex justify-end">
          <button
            type="button"
            :disabled="saving"
            class="flex items-center gap-2 rounded-xl bg-ccisj px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            @click="save"
          >
            <LoaderCircle v-if="saving" class="h-4 w-4 animate-spin" />
            <Save v-else class="h-4 w-4" />
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>

      <div class="space-y-5">
        <!-- Resumen del CV -->
        <section :class="card">
          <div :class="cardHeader">
            <h2 :class="cardTitle">Mi CV</h2>
            <span class="text-xs font-semibold text-ccisj">
              {{ progress }}% completo
            </span>
          </div>

          <dl class="divide-y divide-slate-100">
            <div
              v-for="row in cvSummary"
              :key="row.label"
              class="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
            >
              <dt class="text-slate-500">{{ row.label }}</dt>
              <dd
                :class="
                  row.value === 'Sin cargar'
                    ? 'text-slate-400'
                    : 'font-medium text-slate-800'
                "
              >
                {{ row.value }}
              </dd>
            </div>
          </dl>

          <div class="border-t border-slate-100 p-4">
            <RouterLink
              :to="{ name: 'mi-cv' }"
              class="flex items-center justify-center gap-2 rounded-lg border border-ccisj px-3 py-2 text-sm font-semibold text-ccisj transition hover:bg-ccisj-light"
            >
              <FileUser class="h-4 w-4" />
              {{ progress < 100 ? 'Completar mi CV' : 'Editar mi CV' }}
            </RouterLink>
          </div>
        </section>

        <!-- Contraseña -->
        <RouterLink
          :to="{ name: 'mi-cuenta' }"
          :class="[
            card,
            'flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50',
          ]"
        >
          <KeyRound class="h-5 w-5 shrink-0 text-slate-400" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-slate-800">Contraseña</p>
            <p class="text-xs text-slate-500">Cambiar tu contraseña</p>
          </div>
          <ChevronRight class="h-4 w-4 shrink-0 text-slate-300" />
        </RouterLink>
      </div>
    </div>
  </div>
</template>
