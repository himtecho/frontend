<script setup lang="ts">
defineProps<{ variant: 'price' | 'market' }>()
</script>

<template>
  <div class="row" :class="variant" aria-hidden="true">
    <span class="sk tile" />
    <span class="lines">
      <span class="sk line w-60" />
      <span class="sk line w-40" />
    </span>
    <span class="sk line figure" />
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: var(--space-12);
  min-height: 64px;
  padding: var(--space-12) 0;
  border-bottom: 1px solid var(--line);
}
.lines {
  display: grid;
  gap: var(--space-8);
}
.sk {
  display: block;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--skeleton-base) 25%,
    var(--skeleton-shine) 50%,
    var(--skeleton-base) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}
.tile {
  width: 40px;
  height: 40px;
}
.line {
  height: 12px;
}
.w-60 {
  width: 60%;
}
.w-40 {
  width: 40%;
}
.figure {
  width: 72px;
  height: 20px;
}
.market .figure {
  width: 44px;
  height: 14px;
}
@keyframes shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
</style>
