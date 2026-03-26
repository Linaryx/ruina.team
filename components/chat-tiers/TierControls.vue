<template>
  <div class="controls">
    <label>
      <span>Канал</span>
      <template v-if="channelOptions.length">
        <select v-model="local.channel">
          <option v-for="c in channelOptions" :key="c" :value="c">
            {{ c }}
          </option>
        </select>
      </template>
      <template v-else>
        <input v-model="local.channel" type="text" />
      </template>
    </label>

    <label>
      <span>Период</span>
      <select v-model="local.scope">
        <option v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </label>

    <label>
      <span>Год</span>
      <select v-model.number="local.year">
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
      </select>
    </label>

    <label v-if="local.scope !== 'year'">
      <span>Month</span>
      <select v-model.number="local.month">
        <option v-for="m in monthOptions" :key="m.value" :value="m.value">
          {{ m.label }}
        </option>
      </select>
    </label>

    <label>
      <span>Режим чата</span>
      <select v-model="local.mode">
        <option v-for="opt in modeOptionsComputed" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import type { Mode, Scope } from "~/types/tiers";

const props = defineProps<{
  channel: string;
  scope: Scope;
  year: number;
  month: number;
  mode: Mode;
  availableChannels?: string[];
  availableScopes?: Scope[];
  availableModes?: Mode[];
  availableYears?: number[];
  availableMonths?: number[];
}>();

const emit = defineEmits<{
  (e: "update:channel", v: string): void;
  (e: "update:scope", v: Scope): void;
  (e: "update:year", v: number): void;
  (e: "update:month", v: number): void;
  (e: "update:mode", v: Mode): void;
  (e: "reload"): void;
}>();

const modeOptions: { label: string; value: Mode }[] = [
  { label: "All", value: "all" as Mode },
  { label: "Online", value: "online" as Mode },
  { label: "Offline", value: "offline" as Mode },
];
const scopeOptions = computed<{ label: string; value: Scope }[]>(() => {
  const avail =
    props.availableScopes && props.availableScopes.length
      ? props.availableScopes
      : (["year", "month"] as Scope[]);
  return avail.map((s) => ({
    value: s,
    label: s === "year" ? "Year" : "Month",
  }));
});
const modeOptionsComputed = computed(() => {
  const avail = props.availableModes && props.availableModes.length ? props.availableModes : null;
  const base = avail || (["all", "online", "offline"] as Mode[]);
  return base.map((m: Mode) => ({
    value: m,
    label: m === "all" ? "All" : m === "online" ? "Online" : "Offline",
  }));
});

const local = reactive({
  channel: props.channel,
  scope: props.scope,
  year: props.year,
  month: props.month,
  mode: props.mode,
});

// синхронизируем локальное состояние, если родитель меняет значения
watch(
  () => props.channel,
  (v) => {
    local.channel = v;
  },
);
watch(
  () => props.scope,
  (v) => {
    local.scope = v;
  },
);
watch(
  () => props.year,
  (v) => {
    local.year = v;
  },
);
watch(
  () => props.month,
  (v) => {
    local.month = v;
  },
);
watch(
  () => props.mode,
  (v) => {
    local.mode = v;
  },
);

const currentYear = new Date().getFullYear();
const channelOptions = computed(() => props.availableChannels || []);
const defaultYears = Array.from({ length: currentYear - 2021 }, (_, i) => currentYear - i);
const defaultMonthOptions = [
  { value: 1, label: "01 · Январь" },
  { value: 2, label: "02 · Февраль" },
  { value: 3, label: "03 · Март" },
  { value: 4, label: "04 · Апрель" },
  { value: 5, label: "05 · Май" },
  { value: 6, label: "06 · Июнь" },
  { value: 7, label: "07 · Июль" },
  { value: 8, label: "08 · Август" },
  { value: 9, label: "09 · Сентябрь" },
  { value: 10, label: "10 · Октябрь" },
  { value: 11, label: "11 · Ноябрь" },
  { value: 12, label: "12 · Декабрь" },
];
const monthOptions = computed(() => {
  const avail = props.availableMonths || [];
  if (avail.length) {
    return avail.map((m) => {
      const base = defaultMonthOptions.find((o) => o.value === m);
      return { value: m, label: base ? base.label : m.toString().padStart(2, "0") };
    });
  }
  return defaultMonthOptions;
});
const yearOptions = computed(() =>
  props.availableYears?.length ? props.availableYears : defaultYears,
);
watch(
  () => ({ ...local }),
  (v) => {
    emit("update:channel", v.channel);
    emit("update:scope", v.scope);
    emit("update:year", v.year);
    emit("update:month", v.month);
    emit("update:mode", v.mode);
  },
  { deep: true },
);
</script>

<style scoped>
.controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin: 20px 0;
}
.controls label {
  display: grid;
  gap: 6px;
  font-size: 13px;
}
.controls input,
.controls select {
  background: var(--color-bg);
  border: 1px solid #2d2d2d;
  color: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  appearance: none;
}
.controls select {
  cursor: pointer;
}
.controls .btn {
  align-self: end;
  height: 42px;
}
</style>
