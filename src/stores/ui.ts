import { defineStore } from 'pinia';

/**
 * Estado de la interfaz que comparten el layout, el Sidebar y el Header.
 * En pantallas chicas el menú lateral es un panel que se abre y se cierra;
 * a partir de `lg` está siempre visible y este estado se ignora.
 */
export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarOpen: false,
  }),

  actions: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },

    closeSidebar() {
      this.sidebarOpen = false;
    },
  },
});
