<script setup lang="ts">
import { onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Market } from '../types/api'

const props = defineProps<{
  markets: Market[]
}>()

const emit = defineEmits<{
  select: [market: Market]
}>()

let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null

const marketColors: Record<string, string> = {
  TRADITIONAL: '#16834a',
  CHEAP_MARKET: '#f2b705',
  STORE: '#ed8b24',
  SUPERMARKET: '#2878c8',
}

function createMarker(market: Market): L.DivIcon {
  const color = marketColors[market.type] ?? '#16834a'

  return L.divIcon({
    className: 'market-marker-wrapper',
    html: `
      <div style="
        background:${color};
        width:34px;
        height:34px;
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px #0003;
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:15px">🛒</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  })
}

function renderMarkers() {
  const layer = markerLayer

  if (!layer) return

  layer.clearLayers()

  props.markets.forEach((market) => {
    const marker = L.marker([market.latitude, market.longitude], { icon: createMarker(market) })

    const prices = market.topPrices
      .slice(0, 3)
      .map(
        (item) => `
          <div style="display:flex;justify-content:space-between;gap:12px;margin-top:6px">
            <span>${item.name}</span>
            <strong>Rp ${item.price.toLocaleString('id-ID')}</strong>
          </div>
        `
      )
      .join('')

    const openStatus =
      market.isOpenNow === true
        ? '🟢 Sedang buka'
        : market.isOpenNow === false
          ? '🔴 Sedang tutup'
          : '⚪ Jam operasional belum diketahui'

    const popupContent = `
      <div style="min-width:190px;font-family:Arial,sans-serif">
        <strong style="font-size:14px">${market.name}</strong>
        <p style="margin:6px 0;color:#666">
          ${market.distanceKm.toFixed(1)} km dari lokasi
        </p>
        <p style="margin:6px 0">${openStatus}</p>
        <p style="margin:6px 0;color:#16834a;font-weight:bold">
          Harga unggulan
        </p>
        ${prices || '<p>Belum ada data harga</p>'}
        <button
          class="map-detail-button"
          style="
            margin-top:12px;
            background:#16834a;
            color:white;
            border:0;
            padding:9px 12px;
            border-radius:8px;
            width:100%;
            cursor:pointer;
          "
        >
          Lihat detail
        </button>
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=${market.latitude},${market.longitude}"
          target="_blank"
          rel="noopener noreferrer"
          style="display:block;text-align:center;margin-top:8px;color:#16834a"
        >
          Petunjuk arah
        </a>
      </div>
    `

    marker.bindPopup(popupContent)

    marker.on('popupopen', (event) => {
      const button = event.popup
        .getElement()
        ?.querySelector<HTMLButtonElement>('.map-detail-button')

      button?.addEventListener('click', () => {
        emit('select', market)
      })
    })

    marker.addTo(layer)
  })
}

onMounted(async () => {
  await nextTick()

  const mapElement = document.getElementById('murah-market-map')

  if (!mapElement) return

  map = L.map(mapElement, {
    zoomControl: true,
  }).setView([-6.9175, 107.6191], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  markerLayer = L.layerGroup()
  markerLayer.addTo(map)

  renderMarkers()

  requestAnimationFrame(() => {
    map?.invalidateSize()
  })
})

watch(
  () => props.markets,
  () => renderMarkers(),
  { deep: true }
)

onUnmounted(() => {
  map?.remove()
  map = null
  markerLayer = null
})
</script>

<template>
  <div class="market-map-container">
    <div id="murah-market-map" class="market-map"></div>

    <div class="map-legend">
      <span><i class="dot traditional"></i> Pasar tradisional</span>
      <span><i class="dot cheap"></i> Pasar murah</span>
      <span><i class="dot store"></i> Toko</span>
      <span><i class="dot supermarket"></i> Supermarket</span>
    </div>
  </div>
</template>

<style scoped>
.market-map-container {
  width: 100%;
  overflow: hidden;
  border-radius: 18px;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.market-map {
  width: 100%;
  height: 360px;
  z-index: 1;
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  padding: 14px;
  font-size: 11px;
  color: #52635a;
}

.map-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 9px;
  height: 9px;
  display: inline-block;
  border-radius: 50%;
}

.traditional {
  background: #16834a;
}

.cheap {
  background: #f2b705;
}

.store {
  background: #ed8b24;
}

.supermarket {
  background: #2878c8;
}
</style>
