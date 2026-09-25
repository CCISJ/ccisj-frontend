<script setup lang="ts">
import { onUnmounted, watch } from 'vue';

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

watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : '';
  },
  { immediate: true },
);

onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]"
        @click.self="handleBackdropClick"
      >
        <Transition
          appear
          enter-active-class="transition duration-200"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="transition duration-150"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 opacity-0"
        >
          <div
            class="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            :class="widthClasses[maxWidth]"
          >
            <!-- Header -->
            <div
              v-if="title || $slots.header"
              class="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4"
            >
              <div class="min-w-0 flex-1">
                <slot name="header">
                  <h2 class="text-lg font-semibold text-slate-900">
                    {{ title }}
                  </h2>
                </slot>
              </div>

              <button
                type="button"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
                @click="emit('close')"
              >
                <X :size="18" />
              </button>
            </div>

            <!-- Contenido -->
            <div class="min-h-0 flex-1 overflow-y-auto">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="border-t border-slate-200 bg-slate-50 px-6 py-4"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
