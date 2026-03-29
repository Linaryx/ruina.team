<template>
  <div class="summary">
    <div class="summary-item summary-item--period">
      <p class="label">Период</p>
      <div class="summary-slot">
        <p v-if="!loading" class="value value--period">
          {{ period }}
          <span class="muted"> ({{ timezone }})</span>
        </p>
        <div v-else class="summary-skeleton" aria-hidden="true"></div>
      </div>
    </div>
    <div class="summary-item summary-item--users">
      <p class="label">Чаттеров</p>
      <div class="summary-slot">
        <p v-if="!loading" class="value">{{ users.toLocaleString() }}</p>
        <div v-else class="summary-skeleton" aria-hidden="true"></div>
      </div>
    </div>
    <div class="summary-item summary-item--messages">
      <p class="label">Сообщений</p>
      <div class="summary-slot">
        <p v-if="!loading" class="value">{{ messages.toLocaleString() }}</p>
        <div v-else class="summary-skeleton" aria-hidden="true"></div>
      </div>
    </div>
    <div class="summary-item summary-item--unique">
      <p class="label">Уникальных</p>
      <div class="summary-slot">
        <p v-if="!loading" class="value">{{ unique.toLocaleString() }}</p>
        <div v-else class="summary-skeleton" aria-hidden="true"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    period: string;
    timezone: string;
    users: number;
    messages: number;
    unique: number;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);
</script>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item {
  --summary-value-width: 8ch;
  --summary-value-height: 1.75rem;
}

.summary-item--period {
  --summary-value-width: 23ch;
}

.summary-item--users {
  --summary-value-width: 7ch;
}

.summary-item--messages,
.summary-item--unique {
  --summary-value-width: 8ch;
}

.label {
  margin: 0;
  font-size: 12px;
}

.summary-slot {
  margin-top: 2px;
  height: var(--summary-value-height);
  display: flex;
  align-items: center;
}

.value {
  margin: 0;
  width: min(100%, var(--summary-value-width));
  height: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-1);
}

.value--period {
  width: min(100%, var(--summary-value-width));
}

.muted {
  color: #9ca3af;
}

.summary-skeleton {
  position: relative;
  overflow: hidden;
  margin: 0;
  width: min(100%, var(--summary-value-width));
  height: 100%;
  box-sizing: border-box;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.summary-skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.18) 50%,
    transparent 100%
  );
  animation: summary-shimmer 1.25s linear infinite;
}

@keyframes summary-shimmer {
  to {
    transform: translateX(100%);
  }
}
</style>
