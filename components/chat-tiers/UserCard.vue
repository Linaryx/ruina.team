<template>
  <Teleport to="body">
    <div class="backdrop" @click.self="$emit('close')">
      <div class="card" :style="cardStyle">
        <header class="head">
          <div class="user">
            <img v-if="userData.logo" :src="userData.logo" alt="" />
            <div>
              <p class="title">{{ displayName }}</p>
              <p class="muted mono">ID: {{ userData.id }}</p>
            </div>
          </div>
          <button class="btn primary" @click="$emit('close')">Закрыть</button>
        </header>

        <div class="metrics" v-if="metricItems.length">
          <div v-for="item in metricItems" :key="item.label" class="metric">
            <p class="label">{{ item.label }}</p>
            <p class="value">{{ item.value }}</p>
          </div>
        </div>

        <div class="metric" v-if="selectedEntry">
          <p class="label">Сообщения / Уникальные</p>
          <p class="value">{{ selectedEntry.messages }} / {{ selectedEntry.uniqueMessages }}</p>
        </div>

        <div class="tiers" v-if="selectedEntry">
          <!-- <TierChip label="1м" :tier="selectedEntry.tier1m" :hours="formatHours(selectedEntry.windows1m, 1)" :colors="tierColors" />
          <TierChip label="5м" :tier="selectedEntry.tier5m" :hours="formatHours(selectedEntry.windows5m, 5)" :colors="tierColors" />
          <TierChip label="15м" :tier="selectedEntry.tier15m" :hours="formatHours(selectedEntry.windows15m, 15)" :colors="tierColors" />
          <TierChip label="30м" :tier="selectedEntry.tier30m" :hours="formatHours(selectedEntry.windows30m, 30)" :colors="tierColors" />
          <TierChip label="60м" :tier="selectedEntry.tier60m" :hours="formatHours(selectedEntry.windows60m, 60)" :colors="tierColors" /> -->
          <div class="metric score">
            <p class="label">Место в топе</p>
            <p class="value">
              {{ selectedRank != null ? `#${selectedRank + 1}` : "-" }}
            </p>
          </div>
          <div class="metric score">
            <p class="label">Очки мощи</p>
            <p class="value">{{ powerPoints }}</p>
          </div>
        </div>

        <div class="metric" v-else>
          <p class="label">В этом срезе</p>
          <p class="value">Нет в текущем списке тиров</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import TierChip from "./TierChip.vue";
import type { TierEntry } from "~/types/tiers";
import { buildScoredEntry } from "~/lib/score";

type User = {
  id: string;
  login: string;
  displayName: string;
  logo?: string;
  followers?: number | null;
  createdAt?: string;
  roles?: { isAffiliate?: boolean; isPartner?: boolean | null };
};

const props = defineProps<{
  userData: User;
  displayName: string;
  createdText: string;
  followText: string;
  subText: string;
  roleText: string;
  selectedEntry: TierEntry | null;
  selectedRank: number | null;
  tierColors: Record<string, string>;
}>();

defineEmits<{ (e: "close"): void }>();

const metricItems = [
  { label: "Подписчики", value: props.userData.followers ?? "-" },
  { label: "Возраст аккаунта", value: props.createdText },
  { label: "Фоллов на канал", value: props.followText },
  { label: "Подписка", value: props.subText },
  ...(props.roleText ? [{ label: "Роль", value: props.roleText }] : []),
];

const powerPoints = computed(() => {
  if (!props.selectedEntry) return "-";
  const scored = buildScoredEntry(props.selectedEntry);
  if (Number.isNaN(scored.score)) return "-";
  return scored.scoreRounded;
});

const formatHours = (count: number, minutes: number) => {
  const hours = (count * minutes) / 60;
  return `${hours.toFixed(1)}h`;
};

const cardStyle = computed(() => ({
  "--card-avatar-bg": props.userData.logo ? `url("${props.userData.logo}")` : "none",
}));
</script>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 30;
}

.card {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(circle at 20% 0%, rgba(255, 255, 255, 0.08), transparent 34%),
    linear-gradient(180deg, rgba(16, 16, 18, 0.96), rgba(5, 5, 6, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  padding: 18px;
  width: 100%;
  max-width: clamp(320px, 80vw, 440px);
  color: #ffffff;
  font-weight: 700;
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.58),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: none !important;
}

.card::before {
  content: "";
  position: absolute;
  top: -42px;
  right: -52px;
  width: 280px;
  height: 280px;
  z-index: -2;
  background-image: var(--card-avatar-bg);
  background-position: center;
  background-size: cover;
  border-radius: 50%;
  filter: blur(10px) saturate(0.85) brightness(0.82);
  opacity: 0.5;
  transform: scale(1.18);
}

.card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.72)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), transparent 38%), rgba(0, 0, 0, 0.26);
}

.card:hover {
  transform: none !important;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.user {
  display: flex;
  gap: 10px;
  align-items: center;
}

.user img {
  width: clamp(40px, 10vw, 48px);
  height: clamp(40px, 10vw, 48px);
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.52),
    0 0 0 3px rgba(255, 255, 255, 0.06);
}

.title {
  margin: 0;
  font-weight: 800;
  color: #ffffff;
}

.muted {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 700;
  opacity: 0.95;
}

.mono {
  font-family: var(--font-base);
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px 12px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(255, 255, 255, 0.075);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 12px;
  color: #ffffff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.label {
  margin: 0;
  font-size: 0.8em;
  color: rgba(255, 255, 255, 0.68);
  font-weight: 700;
}

.value {
  margin: 0;
  font-weight: 800;
  color: #ffffff;
}

.tiers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
  align-items: stretch;
}

.metric.score {
  justify-content: center;
  min-height: 58px;
  width: 100%;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.15s ease;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(10px);
}

.btn:hover {
  border-color: rgba(255, 255, 255, 0.3);
  background-color: rgba(255, 255, 255, 0.14);
  transform: none;
}

.btn:active {
  transform: none;
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.1);
}

/* Force any SVG inside the card (e.g., progress icons) to use white */
.card svg,
.card svg * {
  fill: #ffffff !important;
  stroke: #ffffff !important;
  color: #ffffff !important;
}
</style>
