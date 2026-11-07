// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),

  // Always start at the top when navigating to a new page
  scrollBehavior: () => ({ top: 0 }),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Beranda' },
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/MapView.vue'),
      meta: { title: 'Peta' },
    },
    {
      path: '/cheapest',
      name: 'cheapest',
      component: () => import('../views/CheapestView.vue'),
      meta: { title: 'Termurah' },
    },
    {
      path: '/report',
      name: 'report',
      component: () => import('../views/ReportView.vue'),
      meta: { title: 'Lapor Harga' },
    },
    {
      path: '/commodity/:id',
      name: 'commodity-detail',
      component: () => import('../views/CommodityDetailView.vue'),
      meta: { title: 'Detail Komoditas' },
    },
    {
      path: '/market/:id',
      name: 'market-detail',
      component: () => import('../views/MarketDetailView.vue'),
      meta: { title: 'Detail Pasar' },
    },

    // Redirects for old or alternative paths
    { path: '/peta', redirect: '/map' },
    { path: '/lapor', redirect: '/report' },
    { path: '/schedule', redirect: '/cheapest' },
    { path: '/jadwal', redirect: '/cheapest' },
    { path: '/pasar-murah', redirect: '/cheapest' },
    { path: '/komoditas/:id', redirect: (to) => `/commodity/${to.params.id}` },
    { path: '/pasar/:id', redirect: (to) => `/market/${to.params.id}` },

    // Unknown paths go back to the home page
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  const page = typeof to.meta.title === 'string' ? to.meta.title : null
  document.title = page ? `${page} | HargaPangan` : 'HargaPangan'
})

export default router
