<template>
  <main class="home" :class="{ 'is-ready': isReady }">
    <section class="hero">
      <div class="hero-overlay"></div>
      <div class="hero-inner">
        <h1>
          RUINA
          <br />
          TEAM
        </h1>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-card">
        <div class="footer-inner">
          <h2>Кто мы?</h2>
          <p class="footer-text">
            Команда людей, которым не всё равно. Делаем гайды, модпаки и инструменты для стримеров и
            их сообщества.
          </p>

          <div class="footer-actions">
            <a class="action" href="mailto:contact@ruina.team">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 2v.01L12 13 4 6.01V6h16ZM4 18V8.24l7.4 6.17a2 2 0 0 0 2.4 0L20 8.24V18H4Z"
                />
              </svg>
              <span>contact@ruina.team</span>
            </a>
            <a
              class="action"
              href="https://github.com/Linaryx/linaryx.github.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M12 .5a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.26.79-.56v-2.1c-3.22.7-3.9-1.37-3.9-1.37-.52-1.3-1.28-1.64-1.28-1.64-1.05-.7.08-.69.08-.69 1.16.08 1.77 1.17 1.77 1.17 1.03 1.74 2.7 1.23 3.36.94.1-.73.4-1.23.72-1.51-2.57-.29-5.27-1.26-5.27-5.62 0-1.24.46-2.25 1.2-3.05-.12-.29-.52-1.46.12-3.04 0 0 .98-.31 3.2 1.17a11.2 11.2 0 0 1 5.82 0c2.22-1.48 3.2-1.17 3.2-1.17.64 1.58.24 2.75.12 3.04.74.8 1.2 1.81 1.2 3.05 0 4.37-2.7 5.33-5.28 5.62.41.35.78 1.04.78 2.1v3.1c0 .3.21.66.8.55A11.5 11.5 0 0 0 12 .5Z"
                />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

// On hard refresh (F5) web fonts may apply after first paint, causing a visible "jump".
// We start the hero animation only after fonts are ready (or after a short timeout).
const isReady = ref(false);

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
/* ===== PAGE ===== */

.home {
  background: transparent;
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

/* ===== HERO ===== */

.hero {
  position: relative;
  width: 100%;
  flex: 1 1 auto;
  /* grow to take remaining space */
  min-height: 0;
  /* allow flex child to shrink if needed */
  margin: 0;
  border-radius: 0;
  overflow: hidden;
  border: none;
  box-shadow: none;
  background: url("~/assets/img/bg.webp") center / cover no-repeat;
}

/* ===== TITLE ===== */

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(9, 9, 11, 0.01) 0%, rgba(9, 9, 11, 0.3) 100%),
    url("~/assets/img/ruines.webp") center bottom / min(1400px, 100%) no-repeat;
  transform: translateY(50px);
  will-change: transform;
  opacity: 0;
  animation: none;
  z-index: 0;
  /* sit behind the hero text */
}

.hero-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-inner h1 {
  margin: 0;
  font-size: clamp(5rem, 20vw, 8rem);
  line-height: 0.95;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #ffffff;
  text-align: center;
  text-shadow: 0 0 16px rgba(255, 255, 255, 0.719);
  /* start higher, then slide down on load */
  transform: translateY(-150px);
  will-change: transform;
  opacity: 0;
  animation: none;
}

.home.is-ready .hero-overlay {
  opacity: 1;
  animation: ruin-slide 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.home.is-ready .hero-inner h1 {
  opacity: 1;
  animation: hero-slide 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes hero-slide {
  from {
    transform: translateY(-150px);
  }

  to {
    transform: translateY(-80px);
  }
}

@keyframes ruin-slide {
  from {
    transform: translateY(50px);
  }

  to {
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-overlay,
  .hero-inner h1 {
    animation: none;
    transform: none;
    opacity: 1;
  }
}

/* ===== MOBILE ===== */

@media (max-width: 768px) {
  .hero {
    min-height: 60vh;
  }

  .hero-inner h1 {
    font-size: clamp(3.4rem, 8vw, 6.8rem);
  }
}

.footer {
  position: relative;
  z-index: 2;
  background:
    url("~/assets/img/bg.webp") center / cover no-repeat,
    #0b0b0e;
  margin-top: auto;
  /* push footer to bottom when content is short */
}

.footer-card {
  /* width: 100%; */
  background: rgba(12, 12, 14, 0.92);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-inner {
  width: min(1080px, calc(100% - 32px));
  margin: 0 auto;
  padding: 10px 0;
}

.footer-card h2 {
  margin: 0 0 10px;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.footer-text {
  margin: 0 0 12px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.6;
}

.footer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.action {
  color: #ffffff;
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  transition:
    background 0.12s ease,
    border-color 0.12s ease,
    transform 0.12s ease;
}

.icon {
  width: 16px;
  height: 16px;
  display: inline-block;
  flex: 0 0 auto;
}

.action:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}
</style>
