
<script setup lang="ts">
import { RouterLink } from 'vue-router'

const menus = [
  { label: 'Beranda', path: '/', icon: '⌂' },
  { label: 'Peta', path: '/map', icon: '📍' },
  { label: 'Jadwal', path: '/schedule', icon: '📅' },
  { label: 'Lapor', path: '/report', icon: '📝' },
]
</script>

<template>
  <nav class="bottom-nav">
    <RouterLink
      v-for="menu in menus"
      :key="menu.path"
      :to="menu.path"
      class="nav-item"
      active-class="active"
    >
      <span class="nav-icon">{{ menu.icon }}</span>
      <span>{{ menu.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 12px 8px;
  background: #fff;
  border-top: 1px solid #e5eadf;
  box-shadow: 0 -3px 12px rgba(0, 0, 0, 0.05);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #879184;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  flex: 1;
}

.nav-icon {
  font-size: 20px;
}

.nav-item.active {
  color: #16834a;
}
</style>
