<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'secondary', loading: false, disabled: false, type: 'button' }
)
</script>

<template>
  <button
    class="btn"
    :class="`is-${variant}`"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <span v-if="loading" class="spin" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  min-height: var(--tap);
  padding: 0 var(--space-16);
  border: 1px solid transparent;
  border-radius: var(--radius-card);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.is-primary {
  background: var(--brand);
  color: var(--surface);
}
.is-primary:active:not(:disabled) {
  background: var(--brand-ink);
}
.is-secondary {
  background: var(--surface);
  border-color: var(--line-strong);
  color: var(--ink);
}
.is-secondary:active:not(:disabled) {
  background: var(--brand-tint);
}
.is-ghost {
  background: transparent;
  color: var(--brand);
}
.is-ghost:active:not(:disabled) {
  background: var(--brand-tint);
}
.spin {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
