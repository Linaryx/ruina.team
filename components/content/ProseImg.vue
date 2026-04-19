<script setup lang="ts">
import type { GuideLightboxApi } from "~/types/guide-lightbox";

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    title?: string;
    width?: string | number;
    height?: string | number;
  }>(),
  { src: "", alt: "", title: "" },
);

const lightbox = inject<GuideLightboxApi | null>("guide-lightbox", null);
const myIndex = ref(-1);

onMounted(() => {
  if (lightbox) myIndex.value = lightbox.register(props.src, props.alt);
});

const onClick = () => {
  if (lightbox && myIndex.value >= 0) lightbox.open(myIndex.value);
};
</script>

<template>
  <img
    :src="src"
    :alt="alt"
    :title="title"
    :width="width"
    :height="height"
    loading="lazy"
    decoding="async"
    class="zoomable"
    @click="onClick"
  />
</template>
