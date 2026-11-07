<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getPriceSummary, getNearbyMarkets, describeError, isMockMode } from '../services/api'
import AppButton from '../components/AppButton.vue'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/Appicon.vue'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import InlineAlert from '../components/InlineAlert.vue'
import MarketRow from '../components/MarketRow.vue'
import PriceRow from '../components/PriceRow.vue'
import SkeletonRow from '../components/SkeletonRow.vue'
import TrendBadge from '../components/TrendBadge.vue'
import { useAsync } from '../composables/useAsync'
import { useLocation } from '../composables/useLocation'
import { useOnline } from '../composables/useOnline'
import { formatUpdatedAt } from '../utils/format'

const RADIUS_KM = 5

const online = useOnline()
const { coords, status, request, init } = useLocation()

const summary = useAsync(() => getPriceSummary())

const nearby = useAsync(() => {
  if (!coords.value) {
    return Promise.resolve([])
  }

  return getNearbyMarkets({
    lat: coords.value.lat,
    lon: coords.value.lon,
    radius: RADIUS_KM,
    limit: 3,
  })
})

// ---- price board ----
const query = ref('')
const normalizedQuery = computed(() => query.value.trim().toLowerCase())
const items = computed(() => summary.data.value?.items ?? [])
const filteredItems = computed(() =>
  normalizedQuery.value
    ? items.value.filter((i) => i.name.toLowerCase().includes(normalizedQuery.value))
    : items.value
)
const updatedLabel = computed(() => {
  const updatedAt = summary.data.value?.updatedAt

  return updatedAt ? formatUpdatedAt(updatedAt) : ''
})
const boardLoading = computed(() => summary.loading.value && !summary.data.value)

// ---- nearby markets ----
// Mock mode has no real location, so it loads straight away.
const shownMarkets = computed(() => (nearby.data.value ?? []).slice(0, 3)) // Beranda shows 3 even if the API returns more
const hasLocation = computed(() => isMockMode || coords.value !== null)
const marketsLoading = computed(
  () =>
    (hasLocation.value && nearby.loading.value && !nearby.data.value) ||
    (!hasLocation.value && status.value === 'loading')
)

const locationNotice = computed(() => {
  if (status.value === 'denied')
    return {
      title: 'Izin lokasi ditolak',
      text: 'Aktifkan izin lokasi di pengaturan browser, atau pilih lokasimu secara manual di halaman Peta.',
      canRequest: false,
    }
  if (status.value === 'unavailable')
    return {
      title: 'Lokasi tidak tersedia',
      text: 'Perangkatmu belum bisa menentukan lokasi. Pilih lokasi secara manual di halaman Peta.',
      canRequest: true,
    }
  return {
    title: 'Lokasi belum diaktifkan',
    text: 'Izinkan akses lokasi agar pasar dan toko terdekat bisa ditampilkan.',
    canRequest: true,
  }
})

onMounted(() => {
  summary.run()
  init()
  if (isMockMode) nearby.run()
})
watch(coords, (c) => {
  if (c) nearby.run()
})
</script>

<template>
  <div>
    <AppHeader />

    <main class="page home">
      <InlineAlert v-if="!online" icon="wifi-off" class="offline">
        Kamu sedang offline. Data yang tampil mungkin bukan yang terbaru.
      </InlineAlert>

      <!-- title and search -->
      <section class="intro" aria-labelledby="home-title">
        <h1 id="home-title" class="title">Harga sembako hari ini</h1>
        <p v-if="updatedLabel" class="updated">{{ updatedLabel }}</p>
        <p v-else-if="boardLoading" class="updated"><span class="sk-line" aria-hidden="true" /></p>
      </section>

      <div class="search">
        <label for="search" class="sr-only">Cari komoditas</label>
        <AppIcon name="search" :size="20" class="search-icon" />
        <input
          id="search"
          v-model="query"
          class="search-input"
          type="search"
          inputmode="search"
          autocomplete="off"
          placeholder="Cari beras, minyak, telur"
        />
        <button
          v-if="query"
          type="button"
          class="search-clear"
          aria-label="Hapus pencarian"
          @click="query = ''"
        >
          <AppIcon name="x" :size="18" />
        </button>
      </div>

      <!-- price board -->
      <section class="section" aria-labelledby="board-title">
        <div class="section-head">
          <h2 id="board-title" class="section-title">Papan harga</h2>
        </div>

        <div v-if="boardLoading" class="board" aria-busy="true" aria-label="Memuat harga">
          <SkeletonRow v-for="n in 6" :key="n" variant="price" />
        </div>
        <ErrorState
          v-else-if="summary.error.value && !summary.data.value"
          :message="describeError(summary.error.value)"
          @retry="summary.run"
        />
        <EmptyState
          v-else-if="items.length === 0"
          title="Belum ada data harga"
          text="Harga hari ini belum tersedia. Coba lagi nanti."
        />
        <EmptyState
          v-else-if="filteredItems.length === 0"
          :title="`Tidak ada hasil untuk “${query.trim()}”`"
          text="Periksa ejaan atau coba kata kunci lain."
        >
          <AppButton @click="query = ''">Hapus pencarian</AppButton>
        </EmptyState>
        <ul v-else class="board">
          <li v-for="item in filteredItems" :key="item.commodityId" class="board-item">
            <PriceRow :item="item" />
          </li>
        </ul>
      </section>

      <!-- weekly movement -->
      <section
        v-if="boardLoading || summary.data.value"
        class="section"
        aria-labelledby="move-title"
      >
        <div class="section-head">
          <h2 id="move-title" class="section-title">Pergerakan minggu ini</h2>
        </div>
        <p class="caption">Perubahan harga dibanding 7 hari lalu.</p>

        <div v-if="boardLoading" class="moves" aria-hidden="true">
          <span class="sk-panel" />
          <span class="sk-panel" />
        </div>
        <div v-else-if="summary.data.value" class="moves">
          <div class="panel" role="group" aria-labelledby="rise-title">
            <h3 id="rise-title" class="panel-title">
              <AppIcon name="arrow-up" :size="16" class="up" />Paling naik
            </h3>
            <ul v-if="summary.data.value.topRisers.length">
              <li v-for="i in summary.data.value.topRisers" :key="i.commodityId">
                <RouterLink class="move" :to="`/commodity/${i.commodityId}`">
                  <span class="move-name">{{ i.name }}</span>
                  <TrendBadge :trend="i.trend" :percent="i.changePercent" />
                </RouterLink>
              </li>
            </ul>
            <p v-else class="panel-empty">Tidak ada kenaikan berarti</p>
          </div>

          <div class="panel" role="group" aria-labelledby="fall-title">
            <h3 id="fall-title" class="panel-title">
              <AppIcon name="arrow-down" :size="16" class="down" />Paling turun
            </h3>
            <ul v-if="summary.data.value.topFallers.length">
              <li v-for="i in summary.data.value.topFallers" :key="i.commodityId">
                <RouterLink class="move" :to="`/commodity/${i.commodityId}`">
                  <span class="move-name">{{ i.name }}</span>
                  <TrendBadge :trend="i.trend" :percent="i.changePercent" />
                </RouterLink>
              </li>
            </ul>
            <p v-else class="panel-empty">Tidak ada penurunan berarti</p>
          </div>
        </div>
      </section>

      <!-- nearby markets -->
      <section class="section" aria-labelledby="nearby-title">
        <div class="section-head">
          <h2 id="nearby-title" class="section-title">Pasar terdekat</h2>
          <RouterLink to="/map" class="section-link"
            >Lihat peta<AppIcon name="chevron-right" :size="18"
          /></RouterLink>
        </div>

        <div
          v-if="marketsLoading"
          class="board"
          aria-busy="true"
          aria-label="Memuat pasar terdekat"
        >
          <SkeletonRow v-for="n in 3" :key="n" variant="market" />
        </div>

        <div v-else-if="!hasLocation" class="notice">
          <p class="notice-title">{{ locationNotice.title }}</p>
          <p class="notice-text">{{ locationNotice.text }}</p>
          <div class="notice-actions">
            <AppButton v-if="locationNotice.canRequest" variant="primary" @click="request"
              >Pakai lokasiku</AppButton
            >
            <RouterLink to="/map" class="inline-link">Pilih lokasi di peta</RouterLink>
          </div>
        </div>

        <ErrorState
          v-else-if="nearby.error.value && !nearby.data.value"
          :message="describeError(nearby.error.value)"
          @retry="nearby.run"
        />

        <EmptyState
          v-else-if="nearby.data.value && shownMarkets.length === 0"
          :title="`Belum ada pasar dalam ${RADIUS_KM} km`"
          text="Coba cari di peta dengan jarak yang lebih jauh."
        >
          <RouterLink to="/map" class="inline-link">Buka peta</RouterLink>
        </EmptyState>

        <ul v-else-if="nearby.data.value" class="board">
          <li v-for="m in shownMarkets" :key="m.id" class="board-item">
            <MarketRow :market="m" />
          </li>
        </ul>
      </section>

      <!-- quiet entry to Termurah -->
      <RouterLink to="/cheapest" class="entry">
        <AppIcon name="tag" :size="22" class="entry-icon" />
        <span class="entry-text">Cari harga termurah di sekitarmu</span>
        <AppIcon name="chevron-right" :size="20" class="entry-chevron" />
      </RouterLink>

      <p class="footnote">Harga dapat berasal dari PIHPS, estimasi, atau laporan warga.</p>
    </main>
  </div>
</template>

<style scoped>
.offline {
  margin-top: var(--space-12);
}

/* intro */
.intro {
  padding: var(--space-24) 0 var(--space-16);
}
.title {
  font-size: var(--fs-title);
  line-height: var(--lh-title);
  font-weight: var(--fw-bold);
  letter-spacing: -0.01em;
}
.updated {
  margin-top: var(--space-4);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}
.sk-line {
  display: block;
  width: 160px;
  height: 12px;
  border-radius: var(--radius-sm);
  background: var(--skeleton-base);
}

/* search */
.search {
  position: relative;
}
.search-icon {
  position: absolute;
  top: 50%;
  left: var(--space-16);
  transform: translateY(-50%);
  color: var(--ink-muted);
  pointer-events: none;
}
.search-input {
  width: 100%;
  height: 48px;
  padding: 0 48px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-card);
  background: var(--surface);
  font-size: 16px; /* 16px stops iOS zooming on focus */
  line-height: var(--lh-body);
  appearance: none;
}
.search-input::placeholder {
  color: var(--ink-muted);
}
.search-input::-webkit-search-cancel-button {
  display: none;
}
.search-clear {
  position: absolute;
  top: 50%;
  right: 2px;
  display: grid;
  place-items: center;
  width: var(--tap);
  height: var(--tap);
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: var(--ink-muted);
  cursor: pointer;
}

/* sections */
.section {
  margin-top: var(--space-32);
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
  min-height: var(--tap);
}
.section-title {
  font-size: var(--fs-heading);
  line-height: var(--lh-heading);
  font-weight: var(--fw-bold);
}
.section-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  font-weight: var(--fw-semibold);
  color: var(--brand);
}
.caption {
  margin-bottom: var(--space-12);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}

/* ruled lists: hairlines, two columns from 640px up */
.board {
  border-top: 1px solid var(--line);
}
.board-item {
  border-bottom: 1px solid var(--line);
}
@media (min-width: 640px) {
  ul.board {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: var(--space-32);
    border-top: 0;
  }
  ul.board > .board-item:nth-child(-n + 2) {
    border-top: 1px solid var(--line);
  }
}

/* weekly movement */
.moves {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
}
.panel {
  min-width: 0;
  padding: var(--space-12);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding-bottom: var(--space-8);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-bold);
}
.up {
  color: var(--up);
}
.down {
  color: var(--down);
}
.panel li + li {
  border-top: 1px solid var(--line);
}
.move {
  display: grid;
  gap: 2px;
  min-height: var(--tap);
  padding: var(--space-8) 0;
}
.move-name {
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  font-weight: var(--fw-semibold);
  overflow-wrap: anywhere;
}
.panel-empty {
  padding: var(--space-8) 0;
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}
.sk-panel {
  display: block;
  height: 112px;
  border-radius: var(--radius-card);
  background: var(--skeleton-base);
}

/* location notice */
.notice {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-16);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}
.notice-title {
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-bold);
}
.notice-text {
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}
.notice-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-8) var(--space-16);
  margin-top: var(--space-12);
}
.inline-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap);
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  color: var(--brand);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* quiet entry to Termurah */
.entry {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  min-height: 56px;
  margin-top: var(--space-32);
  padding: var(--space-12) var(--space-16);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  transition: background var(--dur-fast) var(--ease-out);
}
.entry:active {
  background: var(--brand-tint);
}
.entry-icon {
  color: var(--brand);
}
.entry-text {
  flex: 1;
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-semibold);
}
.entry-chevron {
  color: var(--ink-muted);
}

.footnote {
  margin-top: var(--space-24);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}
</style>
