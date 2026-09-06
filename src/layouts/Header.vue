<!-- Header.vue -->
<script setup lang="ts">
import { Search, Bell, ChevronDown } from 'lucide-vue-next';
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-20 items-center border-b border-slate-200 bg-white px-6"
  >
    <div class="relative w-full max-w-xl">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      />

      <input
        type="text"
        placeholder="Buscar socios, ofertas, postulantes..."
        class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
      />
    </div>

    <div class="ml-auto flex h-full items-center gap-3">
      <button
        class="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-ccisj-light hover:text-ccisj"
      >
        <Bell class="h-5 w-5" />

        <span class="absolute right-2 top-2 h-2 w-2 rounded-full bg-ccisj" />
      </button>

      <button
        class="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition hover:bg-slate-50"
      >
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-ccisj text-xs font-bold text-white"
        >
          MA
        </div>

        <div class="hidden text-left md:block">
          <p class="text-xs font-semibold leading-tight text-slate-800">
            Martín Alonso
          </p>

          <p class="text-[11px] leading-tight text-slate-400">Personal CCISJ</p>
        </div>

        <ChevronDown class="h-4 w-4 text-slate-400" />
      </button>
    </div>
  </header>
</template>
