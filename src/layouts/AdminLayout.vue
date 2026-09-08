<script setup lang="ts">
import Header from './Header.vue';
import Sidebar from './Sidebar.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Sidebar />

    <div class="lg:pl-64">
      <Header />

      <main class="mx-auto w-full max-w-7xl p-4 md:p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
