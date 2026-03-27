<template>
  <main class="home" :class="{ 'is-ready': isReady }">
    <section class="hero">
      <div class="hero-overlay" aria-hidden="true"></div>
      <div class="hero-noise" aria-hidden="true"></div>
      <div class="hero-fade" aria-hidden="true"></div>

      <div class="hero-inner">
        <div class="hero-wordmark" aria-hidden="true">
          <span>RUINA</span>
          <span>TEAM</span>
        </div>
      </div>
    </section>

    <footer class="home-footer">
      <div class="home-footer-inner">
        <p class="home-footer-brand">ruina.team {{ currentYear }}</p>
        <div class="home-footer-links">
          <a
            class="home-footer-link"
            href="https://github.com/Linaryx/ruina.team"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="GitHub"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.42-4.04-1.42-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.08 1.84 2.82 1.31 3.5 1 .11-.78.42-1.31.77-1.61-2.66-.3-5.47-1.33-5.47-5.9 0-1.3.46-2.36 1.23-3.19-.13-.3-.53-1.52.11-3.17 0 0 1-.32 3.3 1.22a11.4 11.4 0 0 1 6 0c2.29-1.54 3.29-1.22 3.29-1.22.65 1.65.24 2.87.12 3.17.76.83 1.22 1.89 1.22 3.19 0 4.58-2.81 5.6-5.49 5.9.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.83.58A12 12 0 0 0 12 .5Z"
              />
            </svg>
          </a>
          <a
            class="home-footer-link"
            href="https://t.me/linaryx"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            title="Telegram"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.94 4.66a1.5 1.5 0 0 0-1.67-.24L2.96 11.8a1.5 1.5 0 0 0 .16 2.8l4.25 1.42 1.58 5.06a1.5 1.5 0 0 0 2.59.56l2.38-2.91 4.67 3.42a1.5 1.5 0 0 0 2.36-.88l2.96-15.1a1.5 1.5 0 0 0-.57-1.51Zm-3.52 4.03-7.57 6.91a.75.75 0 0 0-.22.38l-.63 2.9-.88-2.82 8.79-8.03a.75.75 0 1 0-1.01-1.1l-10.15 9.27-3.16-1.06 15.65-6.45-2.16 10.99-4.12-3.02a1.5 1.5 0 0 0-1.99.2l-1.13 1.38.39-1.8 7.21-6.58a.75.75 0 1 0-1.01-1.1Z"
              />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const isReady = ref(false);
const currentYear = new Date().getFullYear();

onMounted(() => {
  const start = () => {
    requestAnimationFrame(() => {
      isReady.value = true;
    });
  };

  const maxWaitMs = 400;
  const fontsReady = (document as any)?.fonts?.ready as Promise<void> | undefined;

  if (fontsReady && typeof (fontsReady as any).then === "function") {
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, maxWaitMs))])
      .then(start)
      .catch(start);
    return;
  }

  setTimeout(start, 0);
});
</script>

<style scoped>
.home {
  min-height: 100vh;
  min-height: 100dvh;
  background: #060708;
}

.hero {
  --footer-height: 84px;
  --hero-pad-top: clamp(104px, 12vh, 144px);
  --hero-pad-bottom: 24px;
  position: relative;
  min-height: calc(100vh - var(--footer-height));
  min-height: calc(100dvh - var(--footer-height));
  padding: var(--hero-pad-top) clamp(20px, 5vw, 56px) var(--hero-pad-bottom);
  overflow: hidden;
  background: url("/bg.webp") center / cover no-repeat;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 38%, rgba(188, 222, 226, 0.14), transparent 44%),
    linear-gradient(180deg, rgba(5, 7, 8, 0.18), rgba(5, 7, 8, 0.5)),
    url("/ruines.webp") center bottom / min(1420px, 94%) no-repeat;
  opacity: 0;
  transform: translateY(36px) scale(1.02);
}

.hero-noise {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6, 8, 9, 0.06), rgba(6, 8, 9, 0.28));
  mix-blend-mode: screen;
  opacity: 0;
}

.hero-fade {
  position: absolute;
  inset: auto 0 0;
  height: clamp(140px, 18vh, 220px);
  background: linear-gradient(180deg, rgba(6, 7, 8, 0), rgba(6, 7, 8, 0.72) 54%, #070809 100%);
  z-index: 0;
}

.hero-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - var(--footer-height) - var(--hero-pad-top) - var(--hero-pad-bottom));
  min-height: calc(100dvh - var(--footer-height) - var(--hero-pad-top) - var(--hero-pad-bottom));
}

.hero-wordmark {
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 0;
  text-align: center;
  font-size: clamp(5rem, 14vw, 10rem);
  line-height: 0.88;
  letter-spacing: -0.06em;
  font-weight: 900;
  color: #fff;
  text-shadow:
    0 0 24px rgba(255, 255, 255, 0.7),
    0 0 60px rgba(180, 222, 230, 0.22);
  transform: translateY(-95px);
  opacity: 0;
}

.home-footer {
  position: relative;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(7, 8, 9, 0.92), rgba(7, 8, 9, 0.98)), rgba(7, 8, 9, 0.98);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.home-footer-inner {
  width: min(460px, calc(100% - 40px));
  margin: 0 auto;
  min-height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.home-footer-brand {
  margin: 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.88rem;
  letter-spacing: 0.03em;
}

.home-footer-links {
  display: flex;
  align-items: center;
  gap: 12px;
}

.home-footer-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.68);
  transition:
    color 0.12s ease,
    opacity 0.12s ease,
    transform 0.12s ease;
}

.home-footer-link svg {
  display: block;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
}

.home-footer-link:hover {
  color: #ffffff;
  transform: translateY(-1px);
}

.home.is-ready .hero-overlay {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition:
    opacity 0.9s ease,
    transform 1.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.home.is-ready .hero-noise {
  opacity: 1;
  transition: opacity 1.2s ease;
}

.home.is-ready .hero-wordmark {
  opacity: 1;
  transform: translateY(-90px);
  transition:
    opacity 0.8s ease 0.08s,
    transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.08s;
}

@media (max-width: 1100px) {
  .hero-wordmark {
    transform: none;
    font-size: clamp(4rem, 18vw, 8rem);
  }
}

@media (max-width: 700px) {
  .hero {
    --footer-height: 76px;
    --hero-pad-top: calc(var(--nav-height, 72px) + 28px);
    --hero-pad-bottom: 18px;
    padding-inline: 14px;
  }

  .home-footer-inner {
    width: min(320px, calc(100% - 28px));
    min-height: 76px;
    gap: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-overlay,
  .hero-noise,
  .hero-wordmark {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
</style>
