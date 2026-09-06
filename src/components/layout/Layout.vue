<!-- AppLayout.vue -->
<script setup lang="ts">
import Header from './Header.vue';
import Sidebar from './Sidebar.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <Sidebar />

    <div class="pl-64">
      <Header />

      <main class="p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
