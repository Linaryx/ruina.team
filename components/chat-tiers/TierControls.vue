<template>
  <div class="controls">
    <label>
      <span>Канал</span>
      <template v-if="channelOptions.length">
        <select v-model="channelModel">
          <option v-for="c in channelOptions" :key="c" :value="c">
            {{ c }}
          </option>
        </select>
      </template>
      <template v-else>
        <input v-model="channelModel" type="text" />
      </template>
    </label>

    <label>
      <span>Период</span>
      <select v-model="scopeModel" :disabled="!scopeOptions.length">
        <option v-if="!scopeOptions.length" :value="scopeModel">Нет доступных периодов</option>
        <option v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </label>

    <label>
      <span>Год</span>
      <select v-model.number="yearModel" :disabled="!yearOptions.length">
        <option v-if="!yearOptions.length" :value="yearModel">Нет доступных лет</option>
        <option v-for="y in yearOptions" :key="y" :value="y">
          {{ y }}
        </option>
      </select>
    </label>

    <label v-if="scopeModel !== 'year'">
      <span>Месяц</span>
      <select v-model.number="monthModel" :disabled="!monthOptions.length">
        <option v-if="!monthOptions.length" :value="monthModel">Нет доступных месяцев</option>
        <option v-for="m in monthOptions" :key="m.value" :value="m.value">
          {{ m.label }}
        </option>
      </select>
    </label>

    <label>
      <span>Режим чата</span>
      <select v-model="modeModel" :disabled="!modeOptionsComputed.length">
        <option v-if="!modeOptionsComputed.length" :value="modeModel">
          Нет доступных режимов
        </option>
        <option v-for="opt in modeOptionsComputed" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
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

const channelModel = computed({
  get: () => props.channel,
  set: (value: string) => emit("update:channel", value),
});

const scopeModel = computed({
  get: () => props.scope,
  set: (value: Scope) => emit("update:scope", value),
});

const yearModel = computed({
  get: () => props.year,
  set: (value: number) => emit("update:year", value),
});

const monthModel = computed({
  get: () => props.month,
  set: (value: number) => emit("update:month", value),
});

const modeModel = computed({
  get: () => props.mode,
  set: (value: Mode) => emit("update:mode", value),
});

const scopeOptions = computed<{ label: string; value: Scope }[]>(() => {
  return (props.availableScopes || []).map((s) => ({
    value: s,
    label: s === "year" ? "Год" : "Месяц",
  }));
});
const modeOptionsComputed = computed(() => {
  return (props.availableModes || []).map((m: Mode) => ({
    value: m,
    label: m === "all" ? "Все" : m === "online" ? "Онлайн" : "Оффлайн",
  }));
});

const channelOptions = computed(() => {
  const options = [...(props.availableChannels || [])];
  if (props.channel && !options.includes(props.channel)) {
    options.unshift(props.channel);
  }
  return options;
});
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
const monthOptions = computed(() =>
  (props.availableMonths || []).map((m) => {
    const base = defaultMonthOptions.find((o) => o.value === m);
    return {
      value: m,
      label: base ? base.label : m.toString().padStart(2, "0"),
    };
  }),
);
const yearOptions = computed(() => props.availableYears || []);
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
  border: 1px solid var(--color-border-strong);
  color: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  appearance: none;
  min-width: 0;
}
.controls select {
  cursor: pointer;
}
.controls .btn {
  align-self: end;
  height: 42px;
}

@media (max-width: 640px) {
  .controls {
    grid-template-columns: 1fr;
  }
}
</style>
