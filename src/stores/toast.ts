import { defineStore } from 'pinia';

export type ToastType = 'success' | 'error' | 'info';

export const useToastStore = defineStore('toast', {
  state: () => ({
    visible: false,
    message: '',
    type: 'info' as ToastType,
    timeoutId: null as ReturnType<typeof setTimeout> | null,
  }),

  actions: {
    show(message: string, type: ToastType = 'info') {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.message = message;
      this.type = type;
      this.visible = true;

      this.timeoutId = setTimeout(() => {
        this.visible = false;
        this.timeoutId = null;
      }, 3000);
    },

    success(message: string) {
      this.show(message, 'success');
    },

    error(message: string) {
      this.show(message, 'error');
    },

    info(message: string) {
      this.show(message, 'info');
    },

    close() {
      this.visible = false;

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    },

    /**
     * Con el mouse encima, el aviso no se cierra: quien lo está leyendo (o va
     * a tocar la X) no lo pierde a mitad de camino.
     */
    pause() {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    },

    /** Al sacar el mouse, el aviso queda unos segundos más y se cierra. */
    resume() {
      if (!this.visible || this.timeoutId) return;

      this.timeoutId = setTimeout(() => {
        this.visible = false;
        this.timeoutId = null;
      }, 2000);
    },
  },
});
