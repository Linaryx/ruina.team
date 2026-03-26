<script setup lang="ts">
const route = useRoute();
const isHome = computed(() => route.path === "/");
const isChatTiers = computed(() => route.path.startsWith("/chat-tiers"));

const navRef = ref<{ el: HTMLElement | null } | null>(null);
const navHeight = ref(0);
let observer: ResizeObserver | null = null;

const updateNavHeight = () => {
  const el = navRef.value?.el;
  if (!el) return;
  navHeight.value = el.getBoundingClientRect().height;
};

// app load state: keep the page hidden until browser "load" event fires
// During SSR/prerender we want content rendered immediately, so default true on server.
const isLoaded = ref(process.server);

onMounted(() => {
  const el = navRef.value?.el;
  if (el) {
    updateNavHeight();
    observer = new ResizeObserver(updateNavHeight);
    observer.observe(el);
  }

  // If the document is already fully loaded, set ready immediately
  if (document.readyState === "complete") {
    isLoaded.value = true;
  } else {
    // Wait for the window load event (fires when all resources finished loading)
    window.addEventListener(
      "load",
      () => {
        isLoaded.value = true;
      },
      { once: true },
    );

    // Safety fallback: ensure the app becomes visible eventually
    setTimeout(() => {
      if (!isLoaded.value) isLoaded.value = true;
    }, 10000);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <div>
    <!-- Loading overlay shown until the app is ready -->
    <div v-if="!isLoaded" class="app-loading-root" aria-live="polite">
      <div class="app-loader">
        <!-- Use the progress.svg file directly and avoid applying color/filter overrides -->
        <img
          class="spinner"
          src="/assets/img/svg/progress.svg"
          role="status"
          aria-hidden="true"
          alt=""
        />
        <div class="app-loading-text">Загрузка…</div>
      </div>
    </div>

    <!-- Main site rendered only after "load" -->
    <div
      v-else
      class="page"
      :class="{ 'is-home': isHome, 'is-chat-tiers': isChatTiers }"
      :style="{ '--nav-height': `${navHeight}px` }"
    >
      <div class="site-bg" aria-hidden="true"></div>
      <NavBar ref="navRef" :hero="isHome" />
      <div :class="['shell', { 'shell--full': isHome }]">
        <NuxtPage />
      </div>
    </div>
  </div>
</template>
