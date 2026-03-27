<script setup lang="ts">
defineProps<{
  emoteSrc: string;
  visible: boolean;
}>();
</script>

<template>
  <Transition name="app-loader-fade">
    <div v-if="visible" class="app-loader" role="status" aria-live="polite" aria-label="Загрузка">
      <div class="app-loader__content">
        <img class="app-loader__emote" :src="emoteSrc" alt="" aria-hidden="true" />
        <p class="app-loader__label">
          Загрузка
          <span class="app-loader__dots" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
      </div>
    </div>
  </Transition>
</template>
