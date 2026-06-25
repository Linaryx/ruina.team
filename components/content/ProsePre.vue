<script setup lang="ts">
const props = defineProps<{
  code?: string;
  language?: string | null;
  filename?: string;
  highlights?: number[];
  meta?: string;
  class?: string;
  style?: string | Record<string, string | number>;
}>();

const copied = ref(false);

const copyCode = async () => {
  if (!props.code || typeof window === "undefined") return;
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    window.setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy code:", err);
  }
};
</script>

<template>
  <div class="prose-pre-wrapper" :class="{ 'has-filename': filename }">
    <div v-if="filename" class="prose-pre-filename">{{ filename }}</div>
    <button
      class="prose-pre-copy"
      type="button"
      :aria-label="copied ? 'Код скопирован' : 'Копировать код'"
      :title="copied ? 'Скопировано' : 'Копировать'"
      @click="copyCode"
    >
      <span class="material-symbols-outlined">{{ copied ? "check" : "content_copy" }}</span>
    </button>
    <pre :class="$props.class" :style="$props.style"><slot /></pre>
  </div>
</template>

<style scoped>
.prose-pre-wrapper {
  position: relative;
}

.prose-pre-copy {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #ffffff33;
  border-radius: 8px;
  background: #0f172acc;
  color: var(--color-text-1);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    background 0.12s ease,
    color 0.12s ease,
    border-color 0.12s ease;
}

.prose-pre-wrapper:hover .prose-pre-copy,
.prose-pre-copy:focus-visible {
  opacity: 1;
}

.prose-pre-copy:hover {
  background: var(--color-brand-accent-1);
  border-color: var(--color-brand-accent-1);
  color: #fff;
}

.prose-pre-copy .material-symbols-outlined {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 18px;
  line-height: 1;
}

.prose-pre-filename {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  border-bottom: 1px solid #ffffff22;
  border-radius: 10px 10px 0 0;
  background: #0f172a80;
  color: var(--color-text-2);
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-mono, monospace);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prose-pre-wrapper.has-filename pre {
  padding-top: 42px;
}

.prose-pre-wrapper.has-filename .prose-pre-copy {
  top: 38px;
}

@media (max-width: 640px) {
  .prose-pre-copy {
    opacity: 1;
  }
}
</style>
