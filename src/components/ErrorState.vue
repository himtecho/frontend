<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppIcon from './Appicon.vue'

defineProps<{ message: string; retryLabel?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="error" role="alert">
    <AppIcon name="alert" :size="24" />
    <p class="message">{{ message }}</p>
    <AppButton @click="$emit('retry')">
      <AppIcon name="refresh" :size="18" />
      {{ retryLabel ?? 'Coba lagi' }}
    </AppButton>
  </div>
</template>

<style scoped>
.error {
  display: grid;
  justify-items: center;
  gap: var(--space-12);
  padding: var(--space-24) var(--space-16);
  text-align: center;
  color: var(--danger);
}
.message {
  max-width: 34ch;
  color: var(--ink);
}
</style>
