<template>
  <div class="loading-bar">
    <span class="dot">●</span>
    <span class="text">Запрос: {{ label }} · {{ elapsedMs }} ms</span>
    <span class="note">{{ note }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  elapsedMs: number;
  note: string;
}>();
</script>

<style scoped>
.loading-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin: 12px 0;
  background: var(--color-bg);
  border: 1px solid #2d2d2d;
  border-radius: 12px;
  color: #fff;
  font-size: 13px;
}
.dot {
  color: #7dd3fc;
  animation: pulse 1s infinite;
}
.note {
  color: #9ca3af;
  font-size: 12px;
}
@keyframes pulse {
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.3;
  }
}
</style>
