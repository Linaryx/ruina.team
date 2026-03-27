<template>
  <div class="table-wrap" ref="wrapEl">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>User</th>
          <!-- <th>Сообщений</th>
          <th>Уникальных</th>
          <th>1m</th>
          <th>5m</th>
          <th>15m</th>
          <th>30m</th>
          <th>60m</th> -->
          <th>Счёт</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in scoredEntries" :key="row.userId">
          <td>{{ idx + 1 }}</td>
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
          <!-- <td>{{ row.messages }}</td>
          <td>{{ row.uniqueMessages }}</td>
          <td>
            <div class="tier-stack" :style="tierBorderStyle(row.tier1m)">
              <span class="tier-text" :style="tierTextStyle(row.tier1m)">{{ row.tier1m || '-' }}</span>
              <span class="tier-hours">{{ row.windows1m, ' 1m' }}</span>
            </div>
          </td>
          <td>
            <div class="tier-stack" :style="tierBorderStyle(row.tier5m)">
              <span class="tier-text" :style="tierTextStyle(row.tier5m)">{{ row.tier5m || '-' }}</span>
              <span class="tier-hours">{{ row.windows5m, ' 5m' }}</span>
            </div>
          </td>
          <td>
            <div class="tier-stack" :style="tierBorderStyle(row.tier15m)">
              <span class="tier-text" :style="tierTextStyle(row.tier15m)">{{ row.tier15m || '-' }}</span>
              <span class="tier-hours">{{ row.windows15m, ' 15m' }}</span>
            </div>
          </td>
          <td>
            <div class="tier-stack" :style="tierBorderStyle(row.tier30m)">
              <span class="tier-text" :style="tierTextStyle(row.tier30m)">{{ row.tier30m || '-' }}</span>
              <span class="tier-hours">{{ row.windows30m, ' 30m' }}</span>
            </div>
          </td>
          <td>
            <div class="tier-stack" :style="tierBorderStyle(row.tier60m)">
              <span class="tier-text" :style="tierTextStyle(row.tier60m)">{{ row.tier60m || '-' }}</span>
              <span class="tier-hours">{{ row.windows60m, ' 60m' }}</span>
            </div>
          </td> -->
          <td>
            <div class="tier-stack" :style="tierBorderStyle(row.tier5m)">
              <span class="tier-text" :style="tierTextStyle(row.tier5m)">{{
                row.scoreRounded
              }}</span>
              <span class="tier-hours">Очков мощи</span>
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
import { sortScoredEntries, windowMultipliers } from "~/lib/score";
const wrapEl = ref<HTMLElement | null>(null);
const sentinelEl = ref<HTMLElement | null>(null);

const props = defineProps<{
  entries: TierEntry[];
  profiles: Record<string, { displayName: string; login: string; logo?: string }>;
  avatarClasses: (id: string) => Record<string, boolean>;
  tierColors: Record<string, string>;
}>();

defineEmits<{
  (e: "open-profile", userId: string): void;
}>();

defineExpose({ wrapEl, sentinelEl });

const formatPoints = (count: number, key: keyof typeof windowMultipliers) => {
  const points = (count || 0) * windowMultipliers[key];
  return points % 1 === 0 ? `${points}` : points.toFixed(0);
};

const scoredEntries = computed(() => sortScoredEntries(props.entries));

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
    padding: "4px 8px",
    borderRadius: "5px",
    color: tierTextColor(color),
  };
};
</script>

<style scoped>
.table-wrap {
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: 14px;
}

table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  font-size: 14px;
  color: #fff;
}

th,
td {
  padding: 8px 6px;
  border-bottom: 1px solid var(--color-surface-soft);
  text-align: left;
}

th {
  font-weight: 600;
  position: sticky;
  top: 0;
  background: rgba(12, 12, 12, 0.98);
  backdrop-filter: blur(6px);
}

tr:hover td {
  /* Use brand accent color (rgba(84,129,138,0.08) == #54818a at 8% opacity) */
  background: rgba(84, 129, 138, 0.08);
}

/* disable any translate lift on table rows */
tr:hover,
tr:hover td {
  transform: none !important;
  transition: none !important;
}

.user {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px;
  align-items: center;
}

.login {
  font-weight: 600;
  cursor: pointer;
  text-decoration-skip-ink: auto;
  text-decoration: underline;
}

.login:hover,
.login:focus {
  outline: none;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.userid {
  font-size: 11px;
  color: #9ca3af;
  margin-left: 2px;
}

.avatar {
  width: 36px;
  height: 36px;
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
  max-width: fit-content;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.tier-hours {
  color: #fff;
  font-size: 12px;
  line-height: 1.1;
}

.tier-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.prefetch-sentinel {
  height: 1px;
  width: 100%;
}

.points {
  font-weight: 700;
  border: 1px solid red;
  /* color: #ffd700; */
}

@media (max-width: 640px) {
  .table-wrap {
    margin-inline: -4px;
  }
}
</style>
