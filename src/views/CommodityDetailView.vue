<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'

const route = useRoute()
</script>

<template>
  <main class="placeholder-page">
    <div class="placeholder-icon">🥬</div>
    <h1>Detail Komoditas</h1>
    <p>Informasi lengkap harga komoditas akan ditampilkan di sini.</p>
    <p class="info">ID Komoditas: {{ route.params.id }}</p>

    <RouterLink to="/" class="back-button"> Kembali ke Beranda </RouterLink>
  </main>
</template>

<style scoped>
.placeholder-page {
  max-width: 500px;
  margin: 40px auto;
  padding: 30px 20px;
  text-align: center;
  color: #203b2d;
}
.placeholder-icon {
  font-size: 48px;
}
h1 {
  font-size: 23px;
}
p {
  color: #78877c;
  font-size: 13px;
}
.info {
  margin: 20px 0;
}
.back-button {
  display: inline-block;
  padding: 11px 18px;
  border-radius: 10px;
  background: #16834a;
  color: white;
  text-decoration: none;
}
</style>
