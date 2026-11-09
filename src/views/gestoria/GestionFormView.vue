<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { RouterLink, useRoute, useRouter } from 'vue-router';

import { ArrowLeft } from 'lucide-vue-next';

import {
  GESTION_ACCEPT,
  createGestion,
  getCategoriasGestion,
  getGestion,
  problemasDeArchivos,
  updateGestion,
  uploadArchivosGestion,
} from '@/services/gestionesService';

import { useToastStore } from '@/stores/toast';

import type { CategoriaGestion, GestionData } from '@/types/gestion.type';

/**
 * Alta y edición de una gestión. Los largos máximos son los que valida el
 * backend. Al dar de alta se pueden elegir archivos: se suben apenas se crea.
 */
const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const editingId = computed(() =>
  route.params.id ? Number(route.params.id) : null,
);

const form = reactive<GestionData>({
  titulo: '',
  descripcion: '',
  categoria: '',
});

const categorias = ref<CategoriaGestion[]>([]);
const files = ref<File[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref('');

function onFiles(event: Event) {
  files.value = Array.from((event.target as HTMLInputElement).files ?? []);
}

async function submit() {
  error.value = '';

  const problemas = problemasDeArchivos(files.value);

  if (problemas.length) {
    error.value = problemas.join(' ');
    return;
  }

  saving.value = true;

  try {
    const data = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      categoria: form.categoria.trim(),
    };

    const gestion = editingId.value
      ? await updateGestion(editingId.value, data)
      : await createGestion(data);

    if (files.value.length) {
      try {
        await uploadArchivosGestion(gestion.id, files.value);
      } catch (err) {
        // La gestión ya quedó guardada: se avisa y se va a su ficha, donde se
        // pueden volver a subir.
        toast.error(
          `La gestión se guardó, pero los archivos no: ${
            err instanceof Error ? err.message : 'error al subirlos'
          }`,
        );
        await router.push({
          name: 'gestion-detalle',
          params: { id: gestion.id },
        });
        return;
      }
    }

    toast.success(editingId.value ? 'Gestión actualizada' : 'Gestión creada');
    await router.push({ name: 'gestion-detalle', params: { id: gestion.id } });
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'No se pudo guardar la gestión';
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    categorias.value = await getCategoriasGestion();
  } catch {
    // Sin sugerencias, la categoría se escribe igual.
  }

  if (!editingId.value) return;

  loading.value = true;

  try {
    const gestion = await getGestion(editingId.value);

    form.titulo = gestion.titulo;
    form.descripcion = gestion.descripcion;
    form.categoria = gestion.categoria;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'No se pudo cargar la gestión';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <RouterLink
      :to="
        editingId
          ? { name: 'gestion-detalle', params: { id: editingId } }
          : { name: 'gestoria' }
      "
      class="inline-flex items-center gap-2 font-semibold text-ccisj hover:underline"
    >
      <ArrowLeft class="h-5 w-5" />
      {{ editingId ? 'Volver a la gestión' : 'Volver a Gestoría' }}
    </RouterLink>

    <header>
      <h1 class="text-3xl font-bold text-slate-900">
        {{ editingId ? 'Editar gestión' : 'Nueva gestión' }}
      </h1>
      <p class="mt-2 text-slate-600">
        Lo que se guarda acá lo ven la administración y los socios directivos.
      </p>
    </header>

    <p v-if="loading" role="status" class="text-slate-600">Cargando...</p>

    <form
      v-else
      class="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
      @submit.prevent="submit"
    >
      <div>
        <label for="gestion-titulo" class="font-semibold text-slate-900">
          Título
        </label>
        <input
          id="gestion-titulo"
          v-model="form.titulo"
          required
          maxlength="200"
          placeholder="Por ejemplo: Renovación de la habilitación municipal"
          class="mt-1 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-900 outline-none focus:border-ccisj focus:ring-2 focus:ring-ccisj-light"
        />
      </div>

      <div>
        <label for="gestion-categoria" class="font-semibold text-slate-900">
          Categoría
        </label>
        <input
          id="gestion-categoria"
          v-model="form.categoria"
          required
          maxlength="80"
          list="gestion-categorias"
          autocomplete="off"
          aria-describedby="gestion-categoria-ayuda"
          class="mt-1 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-900 outline-none focus:border-ccisj focus:ring-2 focus:ring-ccisj-light"
        />
        <datalist id="gestion-categorias">
          <option v-for="c in categorias" :key="c.nombre" :value="c.nombre" />
        </datalist>
        <p id="gestion-categoria-ayuda" class="mt-1 text-sm text-slate-600">
          Elegí una de las que ya existen o escribí una nueva.
        </p>
      </div>

      <div>
        <label for="gestion-descripcion" class="font-semibold text-slate-900">
          Descripción
        </label>
        <textarea
          id="gestion-descripcion"
          v-model="form.descripcion"
          required
          maxlength="20000"
          rows="10"
          class="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-ccisj focus:ring-2 focus:ring-ccisj-light"
        />
      </div>

      <div v-if="!editingId">
        <label for="gestion-archivos" class="font-semibold text-slate-900">
          Archivos (opcional)
        </label>
        <input
          id="gestion-archivos"
          type="file"
          multiple
          :accept="GESTION_ACCEPT"
          aria-describedby="gestion-archivos-ayuda"
          class="mt-1 block w-full text-slate-700 file:mr-4 file:min-h-11 file:rounded-xl file:border-0 file:bg-ccisj-light file:px-4 file:font-semibold file:text-ccisj-dark"
          @change="onFiles"
        />
        <p id="gestion-archivos-ayuda" class="mt-1 text-sm text-slate-600">
          PDF, fotos (JPG o PNG), Word o Excel; hasta 5 y 10 MB cada uno. Se
          pueden agregar más después.
        </p>
      </div>

      <p
        v-if="error"
        role="alert"
        class="rounded-xl bg-red-50 p-3 text-red-700"
      >
        {{ error }}
      </p>

      <div class="flex flex-wrap justify-end gap-3">
        <RouterLink
          :to="
            editingId
              ? { name: 'gestion-detalle', params: { id: editingId } }
              : { name: 'gestoria' }
          "
          class="inline-flex min-h-12 items-center rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancelar
        </RouterLink>

        <button
          type="submit"
          :disabled="saving"
          class="min-h-12 rounded-xl bg-ccisj px-6 font-semibold text-white transition hover:bg-ccisj-dark disabled:opacity-60"
        >
          {{
            saving
              ? 'Guardando...'
              : editingId
                ? 'Guardar cambios'
                : 'Crear gestión'
          }}
        </button>
      </div>
    </form>
  </div>
</template>
