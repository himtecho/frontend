
<script setup lang="ts">
import { RouterView } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
</script>

<template>
  <div class="app-container">
    <RouterView />
    <BottomNav />
  </div>
</template>
