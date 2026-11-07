import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import MapView from '../views/MapView.vue'
import CommodityDetailView from '../views/CommodityDetailView.vue'
import ScheduleView from '../views/ScheduleView.vue'
import ReportView from '../views/ReportView.vue'

const MarketDetailPlaceholder = {
  template: `
    <main style="padding: 24px; text-align: center;">
      <h2>Detail Pasar</h2>
      <p>Halaman detail pasar sedang disiapkan.</p>
      <RouterLink to="/map">Kembali ke Peta</RouterLink>
    </main>
  `,
}

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/map',
      name: 'map',
      component: MapView,
    },
    {
      path: '/commodity/:id',
      name: 'commodity-detail',
      component: CommodityDetailView,
    },
    {
      path: '/market/:id',
      name: 'market-detail',
      component: MarketDetailPlaceholder,
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: ScheduleView,
    },
    {
      path: '/report',
      name: 'report',
      component: ReportView,
    },

    // Alias untuk navigasi lama
    {
      path: '/peta',
      redirect: '/map',
    },
    {
      path: '/jadwal',
      redirect: '/schedule',
    },
    {
      path: '/lapor',
      redirect: '/report',
    },
  ],
})

export default router
