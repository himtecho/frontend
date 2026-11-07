<!-- src/views/MarketDetailView.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <main class="market-detail" style="padding: 24px; text-align: center">
    <h2>Detail Pasar</h2>
    <p>Pasar #{{ route.params.id }}: halaman sedang disiapkan.</p>
    <RouterLink to="/map">Kembali ke Peta</RouterLink>
  </main>
</template>