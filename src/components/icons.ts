// Inline SVG icon set: 24px grid, 1.75px stroke, round caps and joins.
// Static strings only (never user input), rendered by AppIcon.vue.
export const ICONS = {
  'arrow-up': '<path d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/>',
  'arrow-down': '<path d="M12 5v14M5.5 12.5L12 19l6.5-6.5"/>',
  dash: '<path d="M6 12h12"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  pin: '<path d="M12 21c-3.5-3.2-6-6.1-6-9.5a6 6 0 0112 0c0 3.4-2.5 6.3-6 9.5z"/><circle cx="12" cy="11.5" r="2.2"/>',
  'chevron-right': '<path d="M9.5 6l6 6-6 6"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  refresh:
    '<path d="M19.5 12a7.5 7.5 0 01-13 5.1M4.5 12a7.5 7.5 0 0113-5.1"/><path d="M17.8 3.5v3.8h-3.8M6.2 20.5v-3.8h3.8"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
  'wifi-off':
    '<path d="M3 3l18 18M2.5 9a15 15 0 015-3M21.5 9a15 15 0 00-9.5-3.4M5.5 12.5a10 10 0 012.5-1.8M18.5 12.5a10 10 0 00-3-2M8.7 16a5 5 0 016.6 0M12 19.5h.01"/>',
  tag: '<path d="M3.5 4.5h7.6a2 2 0 011.4.6l7.4 7.4a2 2 0 010 2.8l-4.4 4.4a2 2 0 01-2.8 0L5.3 12.3a2 2 0 01-.6-1.4V4.5z"/><circle cx="8" cy="9" r="1.1"/>',
  'market-traditional':
    '<path d="M3.5 9.5L5 4.5h14l1.5 5"/><path d="M3.5 9.5a2.5 2.5 0 005 0 2.5 2.5 0 005 0 2.5 2.5 0 005 0"/><path d="M5 12.5V20h14v-7.5M10 20v-4.5h4V20"/>',
  'market-cheap':
    '<path d="M3.5 4.5h7.6a2 2 0 011.4.6l7.4 7.4a2 2 0 010 2.8l-4.4 4.4a2 2 0 01-2.8 0L5.3 12.3a2 2 0 01-.6-1.4V4.5z"/><circle cx="8" cy="9" r="1.1"/>',
  'market-store':
    '<path d="M4.5 10v9.5h15V10"/><path d="M3.5 10l1.5-5.5h14L20.5 10z"/><path d="M10 19.5v-5h4v5"/>',
  'market-supermarket':
    '<path d="M3.5 5h2.2l2 9h9.6l1.7-6.5H7"/><circle cx="9.5" cy="18.5" r="1.2"/><circle cx="16.5" cy="18.5" r="1.2"/>',
} as const

export type IconName = keyof typeof ICONS
