<template>
  <Teleport to="body">
    <div class="backdrop" @click.self="$emit('close')">
      <div class="card" :style="cardStyle">
        <header class="head">
          <div class="user">
            <img
              v-if="userData.logo"
              :src="userData.logo"
              alt=""
              ref="avatarEl"
              crossorigin="anonymous"
              @load="onAvatarLoad"
            />
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
import { computed, nextTick, onMounted, ref, watch } from "vue";
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

const avatarEl = ref<HTMLImageElement | null>(null);
const accentColor = ref<string | null>(null);
const accentColor2 = ref<string | null>(null);
const bgColor = ref<string | null>(null);
const surfaceColor = ref<string | null>(null);
const textColor = ref<string | null>(null);

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

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
};

const hslToRgb = (h: number, s: number, l: number) => {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r = l,
    g = l,
    b = l;
  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

const adjustLightness = (rgb: [number, number, number], delta: number) => {
  const { h, s, l } = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  const nextL = clamp(l + delta, 0, 1);
  const { r, g, b } = hslToRgb(h, s, nextL);
  return `rgb(${r}, ${g}, ${b})`;
};

const getTextColor = (rgb: [number, number, number]) => {
  const [r, g, b] = rgb.map((c) => c / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#0b0b0b" : "#f5f5f5";
};

const toRgbString = (rgb: [number, number, number]) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

const quantizeChannel = (value: number) => Math.round(value / 24) * 24;

const colorDistance = (a: [number, number, number], b: [number, number, number]) => {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const getMostFrequentColors = (data: Uint8ClampedArray) => {
  const buckets = new Map<string, { color: [number, number, number]; count: number }>();

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) continue;

    const color: [number, number, number] = [
      clamp(quantizeChannel(data[i]), 0, 255),
      clamp(quantizeChannel(data[i + 1]), 0, 255),
      clamp(quantizeChannel(data[i + 2]), 0, 255),
    ];
    const key = color.join(",");
    const existing = buckets.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(key, { color, count: 1 });
    }
  }

  const ranked = [...buckets.values()].sort((a, b) => b.count - a.count);
  const primary = ranked[0]?.color;
  if (!primary) return null;

  const secondary = ranked.find(({ color }) => colorDistance(primary, color) >= 56)?.color ?? primary;
  return { primary, secondary };
};

const extractAccent = async () => {
  if (!avatarEl.value || !avatarEl.value.complete || !avatarEl.value.naturalWidth) return;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 48;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(avatarEl.value, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    const palette = getMostFrequentColors(data);
    if (!palette) return;

    accentColor.value = toRgbString(palette.primary);
    accentColor2.value = toRgbString(palette.secondary);
    bgColor.value = adjustLightness(palette.primary, -0.1);
    surfaceColor.value = adjustLightness(palette.secondary, 0.08);
    textColor.value = getTextColor(palette.primary);
  } catch {
    /* ignore failures, keep theme defaults */
  }
};

const onAvatarLoad = () => {
  extractAccent();
};

watch(
  () => props.userData.logo,
  () => {
    accentColor.value = null;
    accentColor2.value = null;
    bgColor.value = null;
    surfaceColor.value = null;
    textColor.value = null;
    nextTick(() => extractAccent());
  },
);

onMounted(() => {
  if (avatarEl.value?.complete) {
    extractAccent();
  }
});

const formatHours = (count: number, minutes: number) => {
  const hours = (count * minutes) / 60;
  return `${hours.toFixed(1)}h`;
};

const cardStyle = computed(() => ({
  "--card-accent": accentColor.value || "var(--theme-accent)",
  "--card-accent-2": accentColor2.value || accentColor.value || "var(--theme-accent)",
  "--card-bg": bgColor.value || "var(--theme-bg-soft, var(--color-bg3))",
  "--card-surface": surfaceColor.value || "var(--theme-surface, var(--color-surface))",
  "--card-text": textColor.value || "var(--theme-text-main, #ffffff)",
  backgroundColor: bgColor.value || "var(--theme-bg-soft, var(--color-bg3))",
  borderColor: accentColor.value || "var(--theme-accent)",
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
  background: var(--card-bg);
  border: 2px solid var(--card-accent);
  background-repeat: no-repeat;
  border-radius: 14px;
  padding: 1em;
  width: 100%;
  max-width: clamp(320px, 80vw, 440px);
  color: var(--card-text);
  font-weight: 700;
  /* make primary text bold */
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 12px;
  backdrop-filter: blur(8px) brightness(2);
  transition: none !important;
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
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid var(--card-accent);
}

.title {
  margin: 0;
  font-weight: 800;
  color: var(--card-text);
}

.muted {
  color: var(--card-text);
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
  background: var(--card-accent-2);
  backdrop-filter: blur(0px) !important;
  border: 3px solid var(--card-accent-2);
  border-radius: 10px;
  padding: 10px;
  color: var(--card-text);
}

.label {
  margin: 0;
  font-size: 0.8em;
  color: var(--card-text);
  font-weight: 700;
}

.value {
  margin: 0;
  font-weight: 800;
  color: var(--card-text);
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
  border: 2px solid var(--card-accent);
  background: var(--card-surface);
  color: var(--card-text);
  box-shadow: none;
}

.btn:hover {
  border-color: var(--card-surface);
  background-color: var(--card-accent-2);
  transform: none;
}

.btn:active {
  transform: none;
  border: 2px solid var(--card-accent);
  background: var(--card-surface);
}

/* Force any SVG inside the card (e.g., progress icons) to use white */
.card svg,
.card svg * {
  fill: #ffffff !important;
  stroke: #ffffff !important;
  color: #ffffff !important;
}
</style>
