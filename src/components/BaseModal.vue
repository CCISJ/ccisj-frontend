<script setup lang="ts">
import { nextTick, onUnmounted, useId, useTemplateRef, watch } from 'vue';

import { X } from 'lucide-vue-next';

type Props = {
  open: boolean;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  title: '',
  maxWidth: 'md',
  closeOnBackdrop: true,
});

const emit = defineEmits<{
  close: [];
}>();

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    emit('close');
  }
}

const titleId = useId();
const panel = useTemplateRef<HTMLElement>('panel');

/**
 * Escape cierra el modal, como la X. Se escucha en la fase de captura y no
 * sigue de largo: un panel de atrás que también cierra con Escape (el detalle
 * de una postulación, por ejemplo) no se cierra junto con el modal.
 */
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;

  event.stopPropagation();
  emit('close');
}

/** El elemento que tenía el foco al abrir, para devolvérselo al cerrar. */
let previousFocus: HTMLElement | null = null;

watch(
  () => props.open,
  async (open, wasOpen) => {
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
      window.addEventListener('keydown', onKeydown, true);

      // El foco entra al modal: con teclado o lector de pantalla, lo que
      // sigue es el contenido del modal y no la página de atrás.
      previousFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      await nextTick();
      panel.value?.focus();
    } else {
      window.removeEventListener('keydown', onKeydown, true);

      // Al cerrar, el foco vuelve a donde estaba (el botón que lo abrió).
      if (wasOpen) previousFocus?.focus();
      previousFocus = null;
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', onKeydown, true);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-out"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
        @click.self="handleBackdropClick"
      >
        <!--
          Entra desde 95 % (nada aparece de la nada) con la curva fuerte de
          salida, y sale más rápido de lo que entra. Centrado: un modal no
          nace de ningún botón. Con "reducir movimiento" solo se funde.
        -->
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="scale-95 opacity-0 motion-reduce:scale-100"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-out"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 opacity-0 motion-reduce:scale-100"
        >
          <div
            ref="panel"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="title || $slots.header ? titleId : undefined"
            tabindex="-1"
            class="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
            :class="widthClasses[maxWidth]"
          >
            <!-- Header -->
            <div
              v-if="title || $slots.header"
              class="flex items-start justify-between gap-4 border-b border-ccisj-line px-6 py-4"
            >
              <div :id="titleId" class="min-w-0 flex-1">
                <slot name="header">
                  <h2 class="text-lg font-semibold text-slate-900">
                    {{ title }}
                  </h2>
                </slot>
              </div>

              <button
                type="button"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
                @click="emit('close')"
              >
                <X :size="18" aria-hidden="true" />
              </button>
            </div>

            <!-- Contenido -->
            <div class="min-h-0 flex-1 overflow-y-auto">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="border-t border-ccisj-line bg-slate-50 px-6 py-4"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
