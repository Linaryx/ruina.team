<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  imgs: string[];
  index: number;
}>();

const emit = defineEmits<{
  hide: [];
  "update:index": [value: number];
}>();

const current = computed(() => props.imgs[props.index] || "");
const canNav = computed(() => props.imgs.length > 1);

const go = (delta: number) => {
  if (!canNav.value) return;
  const len = props.imgs.length;
  const next = (props.index + delta + len) % len;
  emit("update:index", next);
};

const onKey = (event: KeyboardEvent) => {
  if (!props.visible) return;
  if (event.key === "Escape") emit("hide");
  else if (event.key === "ArrowRight") go(1);
  else if (event.key === "ArrowLeft") go(-1);
};

watch(
  () => props.visible,
  (v) => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = v ? "hidden" : "";
  },
);

onMounted(() => {
  window.addEventListener("keydown", onKey);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  if (typeof document !== "undefined") document.body.style.overflow = "";
});

const onBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) emit("hide");
};
</script>

<template>
  <Teleport to="body">
    <Transition name="lb-fade">
      <div v-if="visible" class="lb-backdrop" @click="onBackdropClick">
        <button class="lb-btn lb-close" aria-label="Закрыть" @click="emit('hide')">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <button
          v-if="canNav"
          class="lb-btn lb-prev"
          aria-label="Предыдущее"
          @click.stop="go(-1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <img class="lb-img" :src="current" :alt="`Изображение ${index + 1}`" draggable="false" />
        <button v-if="canNav" class="lb-btn lb-next" aria-label="Следующее" @click.stop="go(1)">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <div v-if="canNav" class="lb-counter">{{ index + 1 }} / {{ imgs.length }}</div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lb-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  cursor: zoom-out;
}

.lb-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  user-select: none;
  cursor: default;
}

.lb-btn {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(20, 20, 22, 0.78);
  color: #fff;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.lb-btn svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.lb-btn:hover {
  background: rgba(40, 40, 44, 0.92);
  border-color: rgba(255, 255, 255, 0.3);
}

.lb-close {
  top: 16px;
  right: 16px;
}

.lb-prev {
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.lb-next {
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.lb-prev:hover,
.lb-next:hover {
  transform: translateY(-50%) scale(1.05);
}

.lb-counter {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.72);
  font-weight: 600;
  font-size: 14px;
  padding: 6px 12px;
  background: rgba(20, 20, 22, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  pointer-events: none;
}

.lb-fade-enter-active,
.lb-fade-leave-active {
  transition: opacity 0.18s ease;
}

.lb-fade-enter-from,
.lb-fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .lb-backdrop {
    padding: 16px;
  }

  .lb-btn {
    width: 40px;
    height: 40px;
  }
}
</style>
