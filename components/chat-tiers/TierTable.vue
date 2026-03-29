<template>
  <div class="table-wrap" ref="wrapEl">
    <table>
      <colgroup>
        <col class="col-rank" />
        <col class="col-user" />
        <col class="col-metric" />
        <col class="col-metric" />
        <col class="col-power" />
        <col class="col-tier" />
        <col class="col-tier" />
        <col class="col-tier" />
        <col class="col-tier" />
        <col class="col-tier" />
      </colgroup>
      <thead>
        <tr>
          <th>#</th>
          <th>User</th>
          <th>Сообщений</th>
          <th>Уникальных</th>
          <th>Очки мощи</th>
          <th>1m</th>
          <th>5m</th>
          <th>15m</th>
          <th>30m</th>
          <th>60m</th>
        </tr>
      </thead>
      <tbody v-if="loading">
        <tr v-for="rowIdx in skeletonRowItems" :key="`skeleton-${rowIdx}`" class="skeleton-row">
          <td><span class="skeleton-chip skeleton-chip--rank" aria-hidden="true"></span></td>
          <td>
            <div class="user">
              <span class="skeleton-avatar" aria-hidden="true"></span>
              <div class="user-meta">
                <span class="skeleton-line skeleton-line--user" aria-hidden="true"></span>
                <span class="skeleton-line skeleton-line--id" aria-hidden="true"></span>
              </div>
            </div>
          </td>
          <td class="metric-cell">
            <span class="skeleton-line skeleton-line--metric" aria-hidden="true"></span>
          </td>
          <td class="metric-cell">
            <span class="skeleton-line skeleton-line--metric" aria-hidden="true"></span>
          </td>
          <td class="metric-cell">
            <span class="skeleton-line skeleton-line--metric" aria-hidden="true"></span>
          </td>
          <td v-for="cellIdx in 5" :key="`skeleton-tier-${rowIdx}-${cellIdx}`" class="tier-cell">
            <span class="skeleton-chip skeleton-chip--tier" aria-hidden="true"></span>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr
          v-for="(row, idx) in scoredEntries"
          :key="`${animationSeed}-${row.userId}`"
          :class="{ 'data-row': idx <= 35 }"
          :style="rowRevealStyle(idx)"
        >
          <td>{{ rankMap[row.userId] ?? idx + 1 }}</td>
          <td>
            <div class="user">
              <img
                class="avatar"
                :class="avatarClasses(row.userId)"
                :src="profiles[row.userId]?.logo"
                @click="$emit('open-profile', row.userId)"
                alt=""
                loading="lazy"
              />
              <div class="user-meta">
                <span
                  class="login"
                  role="button"
                  tabindex="0"
                  @click="$emit('open-profile', row.userId)"
                  @keydown.enter="$emit('open-profile', row.userId)"
                >
                  {{ profiles[row.userId]?.displayName || row.userLogin || row.userId }}
                </span>
                <span class="userid">ID: {{ row.userId }}</span>
              </div>
            </div>
          </td>
          <td class="metric-cell">{{ formatCount(row.messages) }}</td>
          <td class="metric-cell">{{ formatCount(row.uniqueMessages) }}</td>
          <td class="metric-cell">{{ formatCount(Number(row.scoreRounded)) }}</td>
          <td class="tier-cell">
            <div class="tier-stack" :style="tierBorderStyle(row.tier1m)">
              <span class="tier-text" :style="tierTextStyle(row.tier1m)">{{
                row.tier1m || "-"
              }}</span>
              <span class="tier-hours">{{ formatHours(row.windows1m, 1) }}</span>
            </div>
          </td>
          <td class="tier-cell">
            <div class="tier-stack" :style="tierBorderStyle(row.tier5m)">
              <span class="tier-text" :style="tierTextStyle(row.tier5m)">{{
                row.tier5m || "-"
              }}</span>
              <span class="tier-hours">{{ formatHours(row.windows5m, 5) }}</span>
            </div>
          </td>
          <td class="tier-cell">
            <div class="tier-stack" :style="tierBorderStyle(row.tier15m)">
              <span class="tier-text" :style="tierTextStyle(row.tier15m)">{{
                row.tier15m || "-"
              }}</span>
              <span class="tier-hours">{{ formatHours(row.windows15m, 15) }}</span>
            </div>
          </td>
          <td class="tier-cell">
            <div class="tier-stack" :style="tierBorderStyle(row.tier30m)">
              <span class="tier-text" :style="tierTextStyle(row.tier30m)">{{
                row.tier30m || "-"
              }}</span>
              <span class="tier-hours">{{ formatHours(row.windows30m, 30) }}</span>
            </div>
          </td>
          <td class="tier-cell">
            <div class="tier-stack" :style="tierBorderStyle(row.tier60m)">
              <span class="tier-text" :style="tierTextStyle(row.tier60m)">{{
                row.tier60m || "-"
              }}</span>
              <span class="tier-hours">{{ formatHours(row.windows60m, 60) }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div ref="sentinelEl" class="prefetch-sentinel" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
import type { TierEntry } from "~/types/tiers";
import { normalizeColor, tierTextColor } from "~/constants/tiers";
import { sortScoredEntries } from "~/lib/score";
const wrapEl = ref<HTMLElement | null>(null);
const sentinelEl = ref<HTMLElement | null>(null);

const props = withDefaults(
  defineProps<{
    entries: TierEntry[];
    rankMap: Record<string, number>;
    profiles: Record<string, { displayName: string; login: string; logo?: string }>;
    avatarClasses: (id: string) => Record<string, boolean>;
    tierColors: Record<string, string>;
    loading?: boolean;
    skeletonRows?: number;
    animationSeed?: number;
  }>(),
  {
    loading: false,
    skeletonRows: 11,
    animationSeed: 0,
  },
);

defineEmits<{
  (e: "open-profile", userId: string): void;
}>();

defineExpose({ wrapEl, sentinelEl });

const scoredEntries = computed(() => sortScoredEntries(props.entries));
const skeletonRowItems = computed(() =>
  Array.from({ length: props.skeletonRows }, (_, index) => index + 1),
);

const formatCount = (value: number) => value.toLocaleString("ru-RU");

const formatHours = (count: number, minutes: number) => {
  const hours = (count * minutes) / 60;
  return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1)}ч`;
};

const tierTextStyle = (tier?: string) => {
  if (!tier) return {};
  const color = normalizeColor(props.tierColors[tier]);
  if (!color) return {};
  return {
    color,
    fontWeight: "800",
  };
};

const tierBorderStyle = (tier?: string) => {
  if (!tier) return {};
  const color = normalizeColor(props.tierColors[tier]);
  if (!color) return {};
  return {
    border: `2px solid ${color}`,
    padding: "3px 6px",
    borderRadius: "0",
    color: tierTextColor(color),
  };
};

const ROW_REVEAL_LIMIT = 35;
const ROW_REVEAL_STAGGER_MS = 108;

const rowRevealStyle = (index: number) => {
  if (index > ROW_REVEAL_LIMIT) return undefined;
  const delay = index * ROW_REVEAL_STAGGER_MS;
  return {
    "--row-enter-delay": `${delay}ms`,
  };
};
</script>

<style scoped>
.table-wrap {
  --tier-block-height: 42px;
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

table {
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
  color: #fff;
}

th,
td {
  padding: 7px 6px;
  border-bottom: 1px solid var(--color-surface-soft);
  text-align: left;
  vertical-align: middle;
}

th {
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 4;
  background: var(--color-surface);
  white-space: nowrap;
  box-shadow: inset 0 -1px 0 var(--color-surface-soft);
}

.col-rank {
  width: 42px;
}

.col-user {
  width: 204px;
}

.col-metric {
  width: 96px;
}

.col-power {
  width: 96px;
}

.col-tier {
  width: 82px;
}

tr:hover td {
  /* Use brand accent color (rgba(84,129,138,0.08) == #54818a at 8% opacity) */
  background: rgba(84, 129, 138, 0.08);
}

.data-row {
  opacity: 0;
  transform: translateY(12px);
  animation: row-enter 720ms cubic-bezier(0.16, 0.84, 0.24, 1) forwards;
  animation-delay: var(--row-enter-delay, 0ms);
}

/* disable any translate lift on table rows */
tr:hover,
tr:hover td {
  transform: none !important;
  transition: none !important;
}

.user {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 6px;
  align-items: center;
}

.login {
  display: block;
  font-weight: 600;
  cursor: pointer;
  text-decoration-skip-ink: auto;
  text-decoration: underline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.login:hover,
.login:focus {
  outline: none;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.userid {
  font-size: 10px;
  color: #9ca3af;
  margin-left: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  background: #111;
  border: 1px solid #2d2d2d;
}

.role-mod-border {
  border-color: #00ad03;
  box-shadow: 0 0 0 1px #03e90770;
}

.role-vip-border {
  border-color: #e005b9;
  box-shadow: 0 0 0 1px #f003c470;
}

.tier-stack {
  display: flex;
  width: 100%;
  max-width: none;
  min-height: var(--tier-block-height);
  box-sizing: border-box;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1px;
}

.metric-cell {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.skeleton-row td {
  pointer-events: none;
}

.skeleton-avatar,
.skeleton-line,
.skeleton-chip {
  position: relative;
  overflow: hidden;
  display: inline-block;
  background: rgba(255, 255, 255, 0.08);
}

.skeleton-avatar::after,
.skeleton-line::after,
.skeleton-chip::after {
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
  animation: shimmer 1.25s linear infinite;
}

.skeleton-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.skeleton-line {
  border-radius: 999px;
}

.skeleton-line--user {
  width: 96px;
  height: 14px;
}

.skeleton-line--id {
  width: 72px;
  height: 10px;
}

.skeleton-line--metric {
  width: 54px;
  height: 14px;
}

.skeleton-chip {
  border-radius: 0;
}

.skeleton-chip--rank {
  width: 16px;
  height: 14px;
}

.skeleton-chip--tier {
  width: 100%;
  height: var(--tier-block-height);
  box-sizing: border-box;
}

.tier-hours {
  color: #fff;
  font-size: 11px;
  line-height: 1.1;
  white-space: nowrap;
}

.tier-text {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.95rem;
}

.tier-cell {
  padding-inline: 4px;
}

.prefetch-sentinel {
  height: 1px;
  width: 100%;
}

@keyframes shimmer {
  to {
    transform: translateX(100%);
  }
}

@keyframes row-enter {
  from {
    opacity: 0;
    filter: blur(6px);
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .table-wrap {
    margin-inline: -4px;
  }
}
</style>
