<template>
  <div class="chip" :style="borderStyle">
    <span class="tier-text" :style="textStyle">{{ label }} · {{ tier || "-" }}</span>
    <span class="tier-hours">{{ hours }}</span>
  </div>
</template>

<script setup lang="ts">
import { normalizeColor } from "~/constants/tiers";

const props = defineProps<{
  label: string;
  tier?: string;
  hours: string;
  colors: Record<string, string>;
}>();

const color = computed(() => {
  if (!props.tier) return "#2d2d2d";
  return normalizeColor(props.colors[props.tier]);
});

const borderStyle = computed(() => ({
  border: `1px solid ${color.value}`,
  padding: "4px 8px",
  borderRadius: "10px",
}));

const textStyle = computed(() => ({
  color: color.value,
  fontWeight: "800",
}));
</script>

<style scoped>
.chip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  background: transparent;
  box-sizing: border-box;
  width: 100%;
  min-height: 58px;
}
.tier-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.tier-hours {
  color: #fff;
  font-size: 12px;
  line-height: 1.1;
}
</style>
