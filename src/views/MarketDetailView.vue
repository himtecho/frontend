<!-- src/views/MarketDetailView.vue -->
<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/Appicon.vue'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import InlineAlert from '../components/InlineAlert.vue'
import SkeletonRow from '../components/SkeletonRow.vue'
import SourceBadge from '../components/SourceBadge.vue'
import { useAsync } from '../composables/useAsync'
import { useOnline } from '../composables/useOnline'
import { describeError, getMarketDetail, isApiError } from '../services/api'
import type { MarketType } from '../types/api'

type MarketIcon = 'market-traditional' | 'market-cheap' | 'market-store' | 'market-supermarket'

const TYPE_META: Record<MarketType, { label: string; icon: MarketIcon }> = {
  TRADITIONAL: { label: 'Pasar Tradisional', icon: 'market-traditional' },
  CHEAP_MARKET: { label: 'Pasar Murah', icon: 'market-cheap' },
  STORE: { label: 'Toko', icon: 'market-store' },
  SUPERMARKET: { label: 'Supermarket', icon: 'market-supermarket' },
}

const route = useRoute()
const online = useOnline()

const marketId = computed(() => String(route.params.id))
const market = useAsync(() => getMarketDetail(marketId.value))

onMounted(() => market.run())
// Reload when navigating between two markets without leaving this view
watch(marketId, () => market.run())

const detail = computed(() => market.data.value)
const pageLoading = computed(() => market.loading.value && !detail.value)
const notFound = computed(
  () => isApiError(market.error.value) && market.error.value.code === 'NOT_FOUND'
)

const status = computed(() => {
  const open = detail.value?.isOpenNow
  // null means the hours are unknown: never show "Tutup" in that case
  if (open === null || open === undefined) return { text: 'Jam belum diketahui', tone: 'unknown' }
  return open ? { text: 'Buka', tone: 'open' } : { text: 'Tutup', tone: 'closed' }
})

const routeUrl = computed(() =>
  detail.value
    ? `https://www.google.com/maps/dir/?api=1&destination=${detail.value.latitude},${detail.value.longitude}`
    : '#'
)

const hasEstimate = computed(() => detail.value?.prices.some((p) => p.source === 'SEED') ?? false)

// ---- formatting (Indonesian) ----
const formatPrice = (price: number) => `Rp ${price.toLocaleString('id-ID')}`

function formatShortDate(date: string) {
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

// Monogram fallback when iconUrl is null
const initial = (name: string) => name.trim().charAt(0).toUpperCase()
</script>

<template>
  <div>
    <AppHeader />

    <main class="page market-detail">
      <InlineAlert v-if="!online" icon="wifi-off" class="offline">
        Kamu sedang offline. Data yang tampil mungkin bukan yang terbaru.
      </InlineAlert>

      <RouterLink to="/map" class="back">
        <AppIcon name="chevron-right" :size="18" class="back-icon" />Kembali ke peta
      </RouterLink>

      <!-- loading: skeletons that match the final layout -->
      <template v-if="pageLoading">
        <div class="head" aria-busy="true" aria-label="Memuat detail pasar">
          <span class="sk sk-eyebrow" aria-hidden="true" />
          <span class="sk sk-title" aria-hidden="true" />
          <span class="sk sk-line" aria-hidden="true" />
          <span class="sk sk-chip" aria-hidden="true" />
        </div>
        <section class="section" aria-label="Memuat daftar harga">
          <div class="board" aria-busy="true">
            <SkeletonRow v-for="n in 6" :key="n" variant="price" />
          </div>
        </section>
      </template>

      <!-- error: not found vs. other failures -->
      <EmptyState
        v-else-if="notFound"
        title="Pasar tidak ditemukan"
        text="Pasar ini mungkin sudah tidak terdaftar. Coba pilih pasar lain dari peta."
      >
        <RouterLink to="/map" class="inline-link">Buka peta</RouterLink>
      </EmptyState>

      <ErrorState
        v-else-if="market.error.value && !detail"
        :message="describeError(market.error.value)"
        @retry="market.run"
      />

      <template v-else-if="detail">
        <!-- header -->
        <header class="head">
          <p class="eyebrow">
            <AppIcon :name="TYPE_META[detail.type].icon" :size="18" class="eyebrow-icon" />
            {{ TYPE_META[detail.type].label }}
          </p>
          <h1 class="title">{{ detail.name }}</h1>
          <p class="address">{{ detail.address || 'Alamat belum tersedia' }}</p>

          <ul class="meta">
            <li class="chip" :class="`status-${status.tone}`">{{ status.text }}</li>
            <li v-if="detail.openHours" class="chip">{{ detail.openHours }}</li>
          </ul>

          <a
            class="route-button"
            :href="routeUrl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Lihat rute ke pasar ini di Google Maps (tab baru)"
          >
            <AppIcon name="pin" :size="20" />Lihat rute
          </a>
        </header>

        <!-- price list -->
        <section class="section" aria-labelledby="prices-title">
          <div class="section-head">
            <h2 id="prices-title" class="section-title">Daftar harga</h2>
          </div>

          <EmptyState
            v-if="detail.prices.length === 0"
            title="Belum ada harga di pasar ini"
            text="Harga untuk pasar ini belum tersedia. Kamu bisa membantu lewat halaman Lapor."
          >
            <RouterLink to="/report" class="inline-link">Laporkan harga</RouterLink>
          </EmptyState>

          <ul v-else class="board">
            <li v-for="p in detail.prices" :key="p.commodityId" class="board-item">
              <RouterLink :to="`/commodity/${p.commodityId}`" class="price-row">
                <img
                  v-if="p.iconUrl"
                  :src="p.iconUrl"
                  alt=""
                  class="price-icon"
                  width="40"
                  height="40"
                  loading="lazy"
                />
                <span v-else class="price-icon monogram" aria-hidden="true">
                  {{ initial(p.name) }}
                </span>

                <span class="price-body">
                  <span class="price-name">{{ p.name }}</span>
                  <span class="price-meta">
                    per {{ p.unit
                    }}<template v-if="formatShortDate(p.date)">
                      · {{ formatShortDate(p.date) }}</template
                    >
                  </span>
                  <SourceBadge :source="p.source" />
                </span>

                <strong class="price">{{ formatPrice(p.price) }}</strong>
                <AppIcon name="chevron-right" :size="20" class="price-chevron" />
              </RouterLink>
            </li>
          </ul>

          <p v-if="hasEstimate" class="footnote">
            Harga berlabel Estimasi adalah perkiraan dari harga acuan kota, bukan harga yang dicek
            langsung di lokasi.
          </p>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.offline {
  margin-top: var(--space-12);
}

/* back link */
.back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  min-height: var(--tap);
  margin-top: var(--space-8);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  font-weight: var(--fw-semibold);
  color: var(--brand);
}
.back-icon {
  transform: rotate(180deg);
}

/* header */
.head {
  display: grid;
  justify-items: start;
  gap: var(--space-8);
  padding: var(--space-8) 0 var(--space-16);
}
.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--space-8);
  font-size: var(--fs-micro);
  line-height: var(--lh-micro);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.eyebrow-icon {
  color: var(--brand);
}
.title {
  max-width: 100%;
  font-size: var(--fs-title);
  line-height: var(--lh-title);
  font-weight: var(--fw-bold);
  letter-spacing: -0.01em;
  overflow-wrap: anywhere; /* long names wrap, never break the layout */
}
.address {
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--ink-muted);
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin-top: var(--space-4);
  list-style: none;
}
.chip {
  padding: var(--space-4) var(--space-12);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-pill, 999px);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  font-weight: var(--fw-semibold);
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}
/* open/closed is always text, never color alone */
.chip.status-open {
  border-color: var(--brand);
  background: var(--brand-tint);
  color: var(--brand-ink);
}
.route-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  min-height: var(--tap);
  margin-top: var(--space-8);
  padding: 0 var(--space-16);
  border: 1px solid var(--brand);
  border-radius: var(--radius-card);
  background: var(--surface);
  color: var(--brand);
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  text-decoration: none;
}
.route-button:active {
  background: var(--brand-tint);
}
.route-button:focus-visible,
.back:focus-visible,
.price-row:focus-visible,
.inline-link:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

/* sections */
.section {
  margin-top: var(--space-24);
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

/* ruled list */
.board {
  border-top: 1px solid var(--line);
  list-style: none;
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

/* price row: the whole row is a link to the commodity */
.price-row {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  min-height: 72px;
  padding: var(--space-12) 0;
  color: var(--ink);
  text-decoration: none;
}
.price-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  object-fit: contain;
}
.monogram {
  display: grid;
  place-items: center;
  color: var(--brand);
  font-size: var(--fs-heading);
  font-weight: var(--fw-bold);
}
.price-body {
  display: grid;
  min-width: 0;
  flex: 1;
  justify-items: start;
  gap: 2px;
}
.price-name {
  max-width: 100%;
  overflow: hidden;
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.price-meta {
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}
.price {
  flex-shrink: 0;
  font-size: var(--fs-heading);
  line-height: var(--lh-heading);
  font-weight: var(--fw-bold);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.price-chevron {
  flex-shrink: 0;
  color: var(--ink-muted);
}

.footnote {
  margin-top: var(--space-16);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
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

/* header skeleton */
.sk {
  display: block;
  border-radius: var(--radius-sm);
  background: var(--skeleton-base);
}
.sk-eyebrow {
  width: 110px;
  height: 11px;
}
.sk-title {
  width: 70%;
  height: 28px;
}
.sk-line {
  width: 90%;
  height: 15px;
}
.sk-chip {
  width: 96px;
  height: 28px;
  border-radius: var(--radius-pill, 999px);
}
</style>
