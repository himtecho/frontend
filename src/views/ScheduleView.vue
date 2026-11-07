<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getEvents } from '../services/api'
import type { MarketEvent, EventStatus } from '../types/api'

const events = ref<MarketEvent[]>([])
const loading = ref(false)
const errorMessage = ref('')
const activeFilter = ref<'ALL' | 'ONGOING' | 'UPCOMING'>('ALL')

const filters = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Berlangsung', value: 'ONGOING' },
  { label: 'Akan datang', value: 'UPCOMING' },
] as const

const filteredEvents = computed(() => {
  if (activeFilter.value === 'ALL') return events.value

  return events.value.filter((event) => event.status === activeFilter.value)
})

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function statusLabel(status: EventStatus) {
  const labels: Record<EventStatus, string> = {
    ONGOING: 'Sedang berlangsung',
    UPCOMING: 'Akan datang',
    ENDED: 'Selesai',
  }

  return labels[status]
}

function statusClass(status: EventStatus) {
  return status.toLowerCase()
}

async function loadEvents() {
  loading.value = true
  errorMessage.value = ''

  try {
    events.value = await getEvents({
      range: 'month',
      status: 'ALL',
      limit: 50,
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Gagal memuat jadwal pasar murah.'
  } finally {
    loading.value = false
  }
}

onMounted(loadEvents)
</script>

<template>
  <main class="schedule-page">
    <header class="schedule-header">
      <div class="header-content">
        <span class="eyebrow">AGENDA MURAH</span>
        <h1>Jadwal Pasar Murah</h1>
        <p>
          Temukan kegiatan pasar murah di sekitarmu dan jangan lewatkan kesempatan mendapatkan
          sembako dengan harga terjangkau.
        </p>
      </div>
      <div class="header-icon">📅</div>
    </header>

    <section class="schedule-content">
      <div class="section-heading">
        <div>
          <h2>Agenda Kegiatan</h2>
          <p>Informasi kegiatan pasar murah</p>
        </div>
        <button class="refresh-button" @click="loadEvents">↻ Muat ulang</button>
      </div>

      <div class="filter-list">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="filter-button"
          :class="{ selected: activeFilter === filter.value }"
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>

      <div v-if="loading" class="state-card">
        <div class="loader"></div>
        <p>Memuat jadwal kegiatan...</p>
      </div>

      <div v-else-if="errorMessage" class="state-card error-state">
        <span>⚠️</span>
        <p>{{ errorMessage }}</p>
        <button @click="loadEvents">Coba lagi</button>
      </div>

      <div v-else-if="filteredEvents.length === 0" class="state-card">
        <span>📭</span>
        <h3>Belum ada kegiatan</h3>
        <p>Belum ada jadwal untuk kategori ini.</p>
      </div>

      <div v-else class="event-list">
        <article v-for="event in filteredEvents" :key="event.id" class="event-card">
          <div class="event-card-top">
            <span class="event-category">🛒 Pasar Murah</span>
            <span class="status-badge" :class="statusClass(event.status)">
              {{ statusLabel(event.status) }}
            </span>
          </div>

          <h3>{{ event.title }}</h3>
          <p class="organizer">Diselenggarakan oleh {{ event.organizer }}</p>

          <div class="event-info">
            <div class="info-row">
              <span>📅</span>
              <span>{{ formatDate(event.date) }}</span>
            </div>
            <div class="info-row">
              <span>🕒</span>
              <span>{{ event.time }}</span>
            </div>
            <div class="info-row">
              <span>📍</span>
              <span>{{ event.location }}</span>
            </div>
            <div v-if="event.distanceKm !== undefined" class="info-row">
              <span>🚶</span>
              <span>{{ event.distanceKm }} km dari lokasimu</span>
            </div>
          </div>
        </article>
      </div>

      <p class="schedule-note">
        Informasi jadwal dapat berubah sewaktu-waktu sesuai penyelenggara.
      </p>
    </section>
  </main>
</template>

<style scoped>
.schedule-page {
  min-height: 100vh;
  padding-bottom: 100px;
  background: #f6f9f3;
  color: #203b2d;
}

.schedule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 35px 7% 40px;
  background: linear-gradient(135deg, #126b3b, #229653);
  color: white;
  border-radius: 0 0 28px 28px;
}

.header-content {
  max-width: 650px;
}

.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #ffe28a;
}

.schedule-header h1 {
  margin: 12px 0;
  font-size: clamp(25px, 5vw, 36px);
}

.schedule-header p {
  max-width: 550px;
  margin: 0;
  color: #e3f4e8;
  font-size: 14px;
  line-height: 1.7;
}

.header-icon {
  font-size: 55px;
}

.schedule-content {
  width: min(900px, 90%);
  margin: 30px auto;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.section-heading h2 {
  margin: 0 0 5px;
  font-size: 21px;
}

.section-heading p {
  margin: 0;
  color: #839087;
  font-size: 13px;
}

.refresh-button {
  border: 1px solid #dce9dc;
  background: white;
  color: #16834a;
  border-radius: 10px;
  padding: 9px 13px;
  cursor: pointer;
  font-weight: 600;
}

.filter-list {
  display: flex;
  gap: 9px;
  margin: 24px 0;
  flex-wrap: wrap;
}

.filter-button {
  padding: 10px 17px;
  border: 1px solid #dce8dc;
  border-radius: 30px;
  background: white;
  color: #657469;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.filter-button.selected {
  background: #16834a;
  color: white;
  border-color: #16834a;
}

.event-list {
  display: grid;
  gap: 17px;
}

.event-card {
  padding: 22px;
  border: 1px solid #e8eee5;
  border-radius: 17px;
  background: white;
  box-shadow: 0 4px 15px rgba(32, 59, 45, 0.04);
}

.event-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.event-category {
  color: #16834a;
  font-size: 12px;
  font-weight: 700;
}

.status-badge {
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.status-badge.ongoing {
  color: #16834a;
  background: #e6f6eb;
}

.status-badge.upcoming {
  color: #9b7200;
  background: #fff4cf;
}

.status-badge.ended {
  color: #78817a;
  background: #edf0ed;
}

.event-card h3 {
  margin: 17px 0 5px;
  font-size: 18px;
}

.organizer {
  margin: 0 0 18px;
  color: #89958b;
  font-size: 12px;
}

.event-info {
  display: grid;
  gap: 11px;
  padding-top: 16px;
  border-top: 1px solid #edf1eb;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #56675a;
  font-size: 13px;
  line-height: 1.5;
}

.state-card {
  padding: 40px 20px;
  border-radius: 17px;
  background: white;
  text-align: center;
  color: #758278;
}

.state-card > span {
  font-size: 32px;
}

.state-card h3 {
  color: #203b2d;
}

.state-card button {
  padding: 9px 18px;
  border: none;
  border-radius: 9px;
  background: #16834a;
  color: white;
  cursor: pointer;
}

.loader {
  width: 27px;
  height: 27px;
  margin: auto;
  border: 3px solid #dceadd;
  border-top-color: #16834a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.schedule-note {
  margin-top: 24px;
  color: #89958b;
  font-size: 11px;
  text-align: center;
}

@media (max-width: 520px) {
  .schedule-header {
    padding: 28px 6% 32px;
  }

  .header-icon {
    font-size: 38px;
  }

  .event-card {
    padding: 17px;
  }

  .section-heading {
    align-items: flex-start;
  }
}
</style>
