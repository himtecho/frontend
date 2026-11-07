<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

type NavIcon = 'home' | 'pin' | 'tag' | 'report'

interface NavItem {
  label: string
  path: string
  icon: NavIcon
  // Extra route prefixes that keep this tab highlighted (e.g. detail pages)
  also?: string[]
}

const items: NavItem[] = [
  { label: 'Beranda', path: '/', icon: 'home', also: ['/commodity'] },
  { label: 'Peta', path: '/map', icon: 'pin', also: ['/market'] },
  { label: 'Termurah', path: '/cheapest', icon: 'tag' },
  { label: 'Lapor', path: '/report', icon: 'report' },
]

// 24px grid, 1.75px stroke, rounded caps and joins (drawn in the template)
const paths: Record<NavIcon, string[]> = {
  home: ['M4 11.5 12 5l8 6.5', 'M6 10.5V19h12v-8.5', 'M10 19v-5h4v5'],
  pin: [
    'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z',
    'M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z',
  ],
  tag: [
    'M3.5 12.2V4.5h7.7l9 9a1.6 1.6 0 0 1 0 2.3l-5.4 5.4a1.6 1.6 0 0 1-2.3 0l-9-9Z',
    'M8 8.5h.01',
  ],
  report: ['M6 3.5h9l3.5 3.5v13.5H6Z', 'M14.5 3.5V7.5h4', 'M9 12h6', 'M9 15.5h6'],
}

const route = useRoute()

function isActive(item: NavItem) {
  const prefixes = [item.path, ...(item.also ?? [])]
  // "/" must match exactly, otherwise Beranda would be active on every page
  return prefixes.some((p) => (p === '/' ? route.path === '/' : route.path.startsWith(p)))
}

const active = computed(() => new Set(items.filter(isActive).map((i) => i.path)))
</script>

<template>
  <nav class="bottom-nav" aria-label="Navigasi utama">
    <ul class="nav-list">
      <li v-for="item in items" :key="item.path" class="nav-cell">
        <RouterLink
          :to="item.path"
          class="nav-item"
          :class="{ active: active.has(item.path) }"
          :aria-current="active.has(item.path) ? 'page' : undefined"
        >
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path v-for="d in paths[item.icon]" :key="d" :d="d" />
          </svg>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--z-nav, 100);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  border-top: 1px solid var(--line);
  background: var(--surface);
  box-shadow: var(--shadow-sheet);
}

.nav-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  max-width: 720px;
  margin: 0 auto;
  list-style: none;
}

.nav-cell {
  min-width: 0;
}

.nav-item {
  position: relative;
  display: flex;
  min-height: 56px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-8) var(--space-4);
  color: var(--ink-muted);
  text-decoration: none;
  transition: color var(--dur-fast) var(--ease-out);
}

/* 2px top indicator: active state is shown by indicator + color + weight, not color alone */
.nav-item::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 25%;
  right: 25%;
  height: 2px;
  border-radius: 0 0 2px 2px;
  background: transparent;
}

.nav-item.active {
  color: var(--brand);
}

.nav-item.active::before {
  background: var(--brand);
}

.nav-item:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: -2px;
}

.nav-label {
  max-width: 100%;
  overflow: hidden;
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  font-weight: var(--fw-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item.active .nav-label {
  font-weight: var(--fw-bold);
}

@media (prefers-reduced-motion: reduce) {
  .nav-item {
    transition: none;
  }
}
</style>
