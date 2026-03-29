<script setup lang="ts">
const criticalAssets = ["/bg.webp", "/ruines.webp", "/loading-emote.webp"] as const;
const loadingEmoteSrc = criticalAssets[2];
const appReady = useState("app-ready", () => false);

const route = useRoute();
const isHome = computed(() => route.path === "/");
const isChatTiers = computed(() => route.path.startsWith("/chat-tiers"));
const isLoading = ref(true);

onMounted(async () => {
  await Promise.all([waitForMinimumLoad(), preloadCriticalAssets()]);
  isLoading.value = false;
  window.setTimeout(() => {
    appReady.value = true;
  }, 360);
});

function waitForMinimumLoad() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 1300);
  });
}

async function preloadCriticalAssets() {
  const tasks: Promise<unknown>[] = criticalAssets.map((src) => preloadImage(src));

  if (typeof document !== "undefined" && document.fonts?.ready) {
    tasks.push(document.fonts.ready);
  }

  await Promise.allSettled(tasks);
}

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;

    if (image.complete) {
      resolve();
    }
  });
}
</script>

<template>
  <div>
    <LoadingScreen :visible="isLoading" :emote-src="loadingEmoteSrc" />
    <div class="app-stage" :class="{ 'app-stage--ready': !isLoading }">
      <div class="site" :class="{ 'is-home': isHome, 'is-chat-tiers': isChatTiers }">
        <div class="site-bg" aria-hidden="true"></div>
        <NavBar :hero="isHome" />
        <div :class="['shell', { 'shell--full': isHome }]">
          <NuxtPage />
        </div>
      </div>
    </div>
  </div>
</template>
