<script setup lang="ts">
import { ref } from 'vue'

const commodityName = ref('')
const price = ref<number | null>(null)
const message = ref('')

function submitReport() {
  message.value = 'Form laporan siap. Pengiriman ke server akan disambungkan berikutnya.'
}
</script>

<template>
  <main class="report-page">
    <div class="report-header">
      <span>📝</span>
      <h1>Laporkan Harga</h1>
      <p>Bantu masyarakat mendapatkan informasi harga yang akurat.</p>
    </div>

    <form class="report-form" @submit.prevent="submitReport">
      <label for="commodity">Nama komoditas</label>
      <input id="commodity" v-model="commodityName" placeholder="Contoh: Beras" required />

      <label for="price">Harga per satuan (Rp)</label>
      <input
        id="price"
        v-model.number="price"
        type="number"
        min="1"
        placeholder="Contoh: 14500"
        required
      />

      <button type="submit">Siapkan Laporan</button>

      <p v-if="message" class="message">{{ message }}</p>
    </form>
  </main>
</template>

<style scoped>
.report-page {
  max-width: 500px;
  margin: 30px auto;
  padding: 20px;
  color: #203b2d;
}
.report-header {
  padding: 25px;
  border-radius: 18px;
  background: linear-gradient(135deg, #176b42, #26945b);
  color: white;
}
.report-header span {
  font-size: 35px;
}
.report-header h1 {
  margin-bottom: 8px;
}
.report-header p {
  font-size: 12px;
  line-height: 1.6;
}
.report-form {
  display: grid;
  gap: 12px;
  margin-top: 22px;
  padding: 20px;
  border: 1px solid #e8eee8;
  border-radius: 16px;
  background: white;
}
.report-form label {
  font-size: 12px;
  font-weight: 700;
}
.report-form input {
  padding: 12px;
  border: 1px solid #dce8dd;
  border-radius: 10px;
  font: inherit;
}
.report-form button {
  padding: 13px;
  border: 0;
  border-radius: 10px;
  background: #16834a;
  color: white;
  font-weight: 700;
  cursor: pointer;
}
.message {
  color: #16834a;
  font-size: 12px;
  line-height: 1.5;
}
</style>
