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
  if (activeFilter.value === 'ALL') {
    return events.value
  }

  return events.value.filter((event) => event.status === activeFilter.value)
})

const ongoingCount = computed(() => {
  return events.value.filter((event) => event.status === 'ONGOING').length
})

const upcomingCount = computed(() => {
  return events.value.filter((event) => event.status === 'UPCOMING').length
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
    errorMessage.value =
      error instanceof Error ? error.message : 'Gagal memuat jadwal pasar murah. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}

onMounted(loadEvents)
</script>

<template>
  <main class="schedule-page">
    <header class="schedule-header">
      <div>
        <span class="eyebrow">AGENDA MURAH</span>

        <h1>Jadwal Pasar <span>Murah!</span></h1>

        <p>Temukan informasi kegiatan pasar murah dan jadwalnya di sekitarmu.</p>
      </div>

      <div class="header-icon">📅</div>
    </header>

    <section class="schedule-summary">
      <div class="summary-card">
        <div class="summary-icon">📋</div>
        <div>
          <strong>{{ events.length }}</strong>
          <span>Total kegiatan</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon ongoing-icon">🟢</div>
        <div>
          <strong>{{ ongoingCount }}</strong>
          <span>Berlangsung</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon upcoming-icon">🗓️</div>
        <div>
          <strong>{{ upcomingCount }}</strong>
          <span>Akan datang</span>
        </div>
      </div>
    </section>

    <section class="schedule-content">
      <div class="section-heading">
        <div>
          <h2>Agenda Kegiatan</h2>
          <p>Informasi kegiatan pasar murah.</p>
        </div>

        <button class="refresh-button" type="button" :disabled="loading" @click="loadEvents">
          ↻ Muat ulang
        </button>
      </div>

      <div class="filter-card">
        <div class="filter-heading">
          <div>
            <h3>Filter Jadwal</h3>
            <p>Pilih kategori kegiatan yang ingin kamu lihat.</p>
          </div>
        </div>

        <div class="filter-list">
          <button
            v-for="filter in filters"
            :key="filter.value"
            type="button"
            class="filter-button"
            :class="{ active: activeFilter === filter.value }"
            :aria-pressed="activeFilter === filter.value"
            @click="activeFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <div class="section-heading event-heading">
        <div>
          <h2>Daftar Kegiatan</h2>
          <p>Jadwal pasar murah yang tersedia.</p>
        </div>

        <span class="result-count"> {{ filteredEvents.length }} kegiatan </span>
      </div>

      <div v-if="loading" class="state-card">
        <div class="loader"></div>
        <p>Sedang memuat jadwal kegiatan...</p>
      </div>

      <div v-else-if="errorMessage" class="state-card error-state">
        <span class="state-icon">!</span>
        <h3>Belum berhasil memuat jadwal</h3>
        <p>{{ errorMessage }}</p>

        <button type="button" class="primary-button" @click="loadEvents">Coba lagi</button>
      </div>

      <div v-else-if="filteredEvents.length === 0" class="state-card">
        <span class="state-icon">📭</span>
        <h3>Belum ada kegiatan</h3>
        <p>Belum ada jadwal untuk kategori ini. Coba pilih filter lainnya.</p>
      </div>

      <div v-else class="event-list">
        <article v-for="event in filteredEvents" :key="event.id" class="event-card">
          <div class="event-card-top">
            <span class="event-category"> 🛒 Pasar Murah </span>

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
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 18px 110px;
  color: #203b2d;
}

/* HEADER */

.schedule-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 25px 22px;
  border-radius: 22px;
  background: linear-gradient(135deg, #176b42, #26945b);
  color: white;
  box-shadow: 0 8px 22px rgba(23, 107, 66, 0.16);
}

.eyebrow {
  color: #ffe38a;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.schedule-header h1 {
  margin: 10px 0;
  font-size: clamp(25px, 6vw, 34px);
  line-height: 1.2;
}

.schedule-header h1 span {
  color: #ffdf69;
}

.schedule-header p {
  max-width: 440px;
  margin: 0;
  color: #e5f4e9;
  font-size: 13px;
  line-height: 1.6;
}

.header-icon {
  flex-shrink: 0;
  font-size: 32px;
}

/* RINGKASAN JADWAL */

.schedule-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 22px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  padding: 13px 11px;
  border: 1px solid #e8eee8;
  border-radius: 15px;
  background: white;
  box-shadow: 0 4px 15px rgba(32, 59, 45, 0.04);
}

.summary-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  background: #e8f5ec;
  font-size: 16px;
}

.ongoing-icon {
  background: #e6f6eb;
}

.upcoming-icon {
  background: #fff4cf;
}

.summary-card div:last-child {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.summary-card strong {
  color: #203b2d;
  font-size: 17px;
}

.summary-card span {
  color: #849188;
  font-size: 9px;
}

/* KONTEN */

.schedule-content {
  margin-top: 25px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading h2 {
  margin: 0;
  font-size: 17px;
}

.section-heading p {
  margin: 5px 0 0;
  color: #849188;
  font-size: 11px;
}

/* TOMBOL REFRESH */

.refresh-button {
  padding: 9px 12px;
  border: 1px solid #e2eae3;
  border-radius: 10px;
  background: white;
  color: #16834a;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.refresh-button:hover:not(:disabled) {
  background: #eaf5ec;
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* FILTER */

.filter-card {
  margin-top: 18px;
  padding: 19px;
  border: 1px solid #e8eee8;
  border-radius: 18px;
  background: white;
  box-shadow: 0 4px 15px rgba(32, 59, 45, 0.04);
}

.filter-heading h3 {
  margin: 0;
  font-size: 14px;
}

.filter-heading p {
  margin: 5px 0 0;
  color: #849188;
  font-size: 11px;
}

.filter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.filter-button {
  padding: 9px 13px;
  border: 1px solid #e2eae3;
  border-radius: 20px;
  background: #f9fbf8;
  color: #637369;
  font-size: 10px;
  cursor: pointer;
  transition: 0.2s;
}

.filter-button:hover {
  border-color: #16834a;
  color: #16834a;
}

.filter-button.active {
  border-color: #16834a;
  background: #16834a;
  color: white;
  font-weight: 700;
}

/* DAFTAR KEGIATAN */

.event-heading {
  margin: 25px 0 13px;
}

.result-count {
  padding: 7px 10px;
  border-radius: 20px;
  background: #e8f5ec;
  color: #16834a;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.event-list {
  display: grid;
  gap: 12px;
}

.event-card {
  padding: 17px;
  border: 1px solid #e8eee8;
  border-radius: 17px;
  background: white;
  box-shadow: 0 4px 15px rgba(32, 59, 45, 0.04);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 7px 20px rgba(32, 59, 45, 0.08);
}

.event-card-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.event-category {
  color: #16834a;
  font-size: 11px;
  font-weight: 700;
}

.status-badge {
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
}

.status-badge.ongoing {
  background: #e6f6eb;
  color: #16834a;
}

.status-badge.upcoming {
  background: #fff4cf;
  color: #9b7200;
}

.status-badge.ended {
  background: #edf0ed;
  color: #78817a;
}

.event-card h3 {
  margin: 15px 0 5px;
  color: #203b2d;
  font-size: 15px;
  line-height: 1.4;
}

.organizer {
  margin: 0 0 15px;
  color: #89958b;
  font-size: 11px;
  line-height: 1.5;
}

/* INFORMASI KEGIATAN */

.event-info {
  display: grid;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid #edf1eb;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #56675a;
  font-size: 11px;
  line-height: 1.5;
}

.info-row span:first-child {
  flex-shrink: 0;
}

/* LOADING, ERROR, DAN EMPTY STATE */

.state-card {
  display: flex;
  min-height: 190px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px dashed #dce8dd;
  border-radius: 18px;
  background: white;
  color: #758278;
  text-align: center;
}

.state-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 50%;
  background: #fff3d0;
  color: #a77b00;
  font-size: 22px;
}

.state-card h3 {
  margin: 10px 0 5px;
  color: #203b2d;
  font-size: 15px;
}

.state-card p {
  max-width: 320px;
  margin: 5px 0;
  color: #87938a;
  font-size: 11px;
  line-height: 1.6;
}

.primary-button {
  margin-top: 12px;
  padding: 10px 18px;
  border: 0;
  border-radius: 10px;
  background: #16834a;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.primary-button:hover {
  background: #126b3b;
}

.loader {
  width: 30px;
  height: 30px;
  border: 3px solid #e0eee4;
  border-top-color: #16834a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* CATATAN */

.schedule-note {
  margin-top: 22px;
  color: #89958b;
  font-size: 10px;
  line-height: 1.6;
  text-align: center;
}

/* RESPONSIVE */

@media (max-width: 520px) {
  .schedule-page {
    padding: 20px 15px 100px;
  }

  .schedule-header {
    padding: 22px 18px;
  }

  .schedule-header h1 {
    font-size: 25px;
  }

  .header-icon {
    font-size: 27px;
  }

  .schedule-summary {
    gap: 7px;
  }

  .summary-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
    padding: 11px 9px;
  }

  .summary-card strong {
    font-size: 16px;
  }

  .summary-card span {
    font-size: 9px;
  }

  .filter-card {
    padding: 16px;
  }

  .section-heading h2 {
    font-size: 16px;
  }

  .refresh-button {
    padding: 8px 10px;
    font-size: 10px;
  }

  .event-card {
    padding: 15px;
  }
}
</style>
