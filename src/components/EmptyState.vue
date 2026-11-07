<script setup lang="ts">
defineProps<{
  title: string
  text: string
}>()
</script>

<template>
  <div class="empty-state" role="status">
    <div class="empty-icon" aria-hidden="true">
      <span>∅</span>
    </div>

    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-text">{{ text }}</p>

    <div v-if="$slots.default" class="empty-action">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  padding: var(--space-32) var(--space-16);
  text-align: center;
  border-bottom: 1px solid var(--line);
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: var(--space-4);
  border-radius: 50%;
  background: var(--brand-tint);
  color: var(--brand);
  font-size: 28px;
}

.empty-title {
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-bold);
  color: var(--ink);
}

.empty-text {
  max-width: 320px;
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}

.empty-action {
  margin-top: var(--space-8);
}
</style>
