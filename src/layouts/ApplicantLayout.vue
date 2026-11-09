<script setup lang="ts">
import Header from './Header.vue';
import Sidebar from './Sidebar.vue';
</script>

<template>
  <div class="min-h-screen bg-ccisj-canvas">
    <Sidebar />

    <div class="lg:pl-72">
      <Header />

      <main class="mx-auto w-full max-w-7xl p-4 md:p-8 xl:p-10">
        <RouterView />
      </main>
    </div>
  </div>
</template>
