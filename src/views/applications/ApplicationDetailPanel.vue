<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';

import {
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  Phone,
  X,
  XCircle,
} from 'lucide-vue-next';

import ApplicationStatusBadge from '@/components/ApplicationStatusBadge.vue';

import {
  APPLICATION_STATUS_LABELS,
  MEMBER_APPLICATION_STATES,
  type MemberApplicationStatus,
  type ReceivedApplication,
} from '@/types/application.type';

import { getReceivedCvFileUrl, openSignedFile } from '@/services/cvService';

import { useToastStore } from '@/stores/toast';

import { formatDate } from '@/utils/date';
import { telHref } from '@/utils/url';

const toast = useToastStore();

const props = defineProps<{
  application: ReceivedApplication;
  // Hay un cambio de estado en curso o esperando confirmación.
  busy: boolean;
}>();

const emit = defineEmits<{
  close: [];
  'change-status': [estado: MemberApplicationStatus];
}>();

const fullName = computed(
  () =>
    `${props.application.postulante.nombre} ${props.application.postulante.apellido}`,
);

const phoneHref = computed(() =>
  telHref(props.application.postulante.telefono),
);

const cv = computed(() => props.application.postulante);

const period = (from: string | null, to: string | null, current: boolean) => {
  if (!from && !to && !current) return '';

  return `${from ? formatDate(from) : '?'} – ${
    current ? 'Actualidad' : to ? formatDate(to) : '?'
  }`;
};

/** El CV del formulario, listo para mostrar por bloques. */
const cvBlocks = computed(() => {
  const { estudios, experiencias, referencias } = cv.value;

  const education = (tipo: 'CURRICULAR' | 'NO_CURRICULAR') =>
    estudios
      .filter((item) => item.tipo === tipo)
      .map((item) => ({
        main: item.titulo,
        sub: [item.institucion, period(item.fechaInicio, item.fechaFin, item.enCurso)]
          .filter(Boolean)
          .join(' · '),
        detail: item.descripcion,
      }));

  const references = (tipo: 'LABORAL' | 'PERSONAL') =>
    referencias
      .filter((item) => item.tipo === tipo)
      .map((item) => ({
        main: item.nombre,
        sub: [item.relacion, item.telefono, item.email].filter(Boolean).join(' · '),
        detail: null,
      }));

  return [
    { title: 'Estudios curriculares', lines: education('CURRICULAR') },
    { title: 'Estudios no curriculares', lines: education('NO_CURRICULAR') },
    {
      title: 'Experiencia laboral',
      lines: experiencias.map((item) => ({
        main: `${item.cargo} — ${item.empresa}`,
        sub: period(item.fechaInicio, item.fechaFin, item.actual),
        detail: item.tareas,
      })),
    },
    { title: 'Referencias laborales', lines: references('LABORAL') },
    { title: 'Referencias personales', lines: references('PERSONAL') },
  ].filter((block) => block.lines.length > 0);
});

async function openCvFile(cvId: number) {
  try {
    await openSignedFile(() =>
      getReceivedCvFileUrl(props.application.id, cvId),
    );
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error al abrir el CV');
  }
}

const isFinal = computed(() => props.application.estado === 'FINALIZADA');

const STATUS_ICONS = {
  EN_REVISION: Eye,
  SELECCIONADO: CheckCircle2,
  NO_SELECCIONADO: XCircle,
} as const;

const STATUS_ACTIVE_CLASSES: Record<MemberApplicationStatus, string> = {
  EN_REVISION: 'border-amber-300 bg-amber-50 text-amber-800',
  SELECCIONADO: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  NO_SELECCIONADO: 'border-slate-300 bg-slate-100 text-slate-700',
};

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && !props.busy) emit('close');
}

onMounted(() => document.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));

const sectionTitle =
  'mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400';
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-40">
      <div
        class="absolute inset-0 bg-slate-900/30"
        @click="!busy && emit('close')"
      />

      <aside
        role="dialog"
        aria-modal="true"
        :aria-label="`Postulación de ${fullName}`"
        class="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl"
      >
        <!-- Encabezado -->
        <div
          class="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4"
        >
          <div class="min-w-0">
            <p class="truncate text-lg font-semibold text-slate-900">
              {{ fullName }}
            </p>

            <p class="mt-0.5 text-sm text-slate-500">
              Se postuló a
              <span class="font-medium text-slate-700">
                «{{ application.oferta.titulo }}»
              </span>
              el {{ formatDate(application.fechaPostulacion) }}
            </p>

            <p
              v-if="application.oferta.estado === 'CERRADA'"
              class="mt-1 text-xs text-slate-400"
            >
              La oferta está cerrada.
            </p>
          </div>

          <button
            type="button"
            class="-mr-2 -mt-1 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
            :disabled="busy"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <!-- Estado -->
          <section>
            <div class="mb-2 flex items-center justify-between gap-2">
              <h3
                class="text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                Estado
              </h3>

              <ApplicationStatusBadge :status="application.estado" />
            </div>

            <p v-if="isFinal" class="text-sm text-slate-500">
              La postulación está finalizada y ya no se puede cambiar.
            </p>

            <template v-else>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  v-for="estado in MEMBER_APPLICATION_STATES"
                  :key="estado"
                  type="button"
                  class="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed"
                  :class="
                    application.estado === estado
                      ? STATUS_ACTIVE_CLASSES[estado]
                      : 'border-slate-200 bg-white text-slate-600 hover:border-ccisj hover:text-ccisj disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-600'
                  "
                  :disabled="busy || application.estado === estado"
                  :aria-pressed="application.estado === estado"
                  @click="emit('change-status', estado)"
                >
                  <component :is="STATUS_ICONS[estado]" class="h-4 w-4" />
                  {{ APPLICATION_STATUS_LABELS[estado] }}
                </button>
              </div>

              <p class="mt-2 text-xs text-slate-400">
                Cada cambio le llega a {{ application.postulante.nombre }} como
                notificación.
              </p>
            </template>
          </section>

          <!-- Contacto -->
          <section>
            <h3 :class="sectionTitle">Contacto</h3>

            <ul class="space-y-2 text-sm">
              <li class="flex items-center gap-2">
                <Mail class="h-4 w-4 shrink-0 text-slate-400" />

                <a
                  :href="`mailto:${application.postulante.usuario.email}`"
                  class="truncate text-ccisj hover:underline"
                >
                  {{ application.postulante.usuario.email }}
                </a>
              </li>

              <li class="flex items-center gap-2">
                <Phone class="h-4 w-4 shrink-0 text-slate-400" />

                <a
                  v-if="phoneHref"
                  :href="phoneHref"
                  class="text-ccisj hover:underline"
                >
                  {{ application.postulante.telefono }}
                </a>

                <span v-else class="text-slate-400">Sin teléfono</span>
              </li>
            </ul>
          </section>

          <!-- Mensaje del postulante -->
          <section v-if="application.observaciones">
            <h3 :class="sectionTitle">Mensaje del postulante</h3>

            <p
              class="whitespace-pre-line break-words rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
            >
              {{ application.observaciones }}
            </p>
          </section>

          <!-- CV -->
          <section>
            <h3 :class="sectionTitle">Currículum</h3>

            <dl class="space-y-1 text-sm text-slate-700">
              <div v-if="cv.fechaNacimiento">
                <dt class="inline text-slate-400">Nacimiento:</dt>
                {{ formatDate(cv.fechaNacimiento) }}
              </div>
              <div v-if="cv.direccion">
                <dt class="inline text-slate-400">Dirección:</dt>
                {{ cv.direccion }}
              </div>
            </dl>

            <div
              v-for="block in cvBlocks"
              :key="block.title"
              class="mt-4"
            >
              <p class="mb-1.5 text-xs font-semibold text-slate-500">
                {{ block.title }}
              </p>

              <ul class="space-y-2">
                <li
                  v-for="(line, index) in block.lines"
                  :key="index"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <p class="font-medium text-slate-800">{{ line.main }}</p>
                  <p v-if="line.sub" class="text-xs text-slate-500">
                    {{ line.sub }}
                  </p>
                  <p
                    v-if="line.detail"
                    class="mt-1 whitespace-pre-line break-words text-xs text-slate-600"
                  >
                    {{ line.detail }}
                  </p>
                </li>
              </ul>
            </div>

            <div v-if="cv.otros" class="mt-4">
              <p class="mb-1.5 text-xs font-semibold text-slate-500">Otros</p>
              <p class="whitespace-pre-line break-words text-sm text-slate-700">
                {{ cv.otros }}
              </p>
            </div>

            <p class="mb-1.5 mt-4 text-xs font-semibold text-slate-500">
              CV en PDF
            </p>

            <p v-if="cv.cvs.length === 0" class="text-sm text-slate-400">
              No subió ningún PDF.
            </p>

            <ul v-else class="space-y-2">
              <li
                v-for="file in cv.cvs"
                :key="file.id"
                class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
              >
                <FileText class="h-4 w-4 shrink-0 text-slate-400" />

                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm text-slate-700">
                    {{ file.nombreArchivo ?? file.descripcion ?? 'CV' }}
                  </p>
                  <p class="text-xs text-slate-400">
                    {{ formatDate(file.fechaActualizacion) }}
                  </p>
                </div>

                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-sm font-medium text-ccisj hover:underline"
                  @click="openCvFile(file.id)"
                >
                  Ver
                  <ExternalLink class="h-3.5 w-3.5" />
                </button>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
