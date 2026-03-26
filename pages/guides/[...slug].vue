<script setup lang="ts">
const route = useRoute();
const slugParam = computed(() => {
  const raw = route.params.slug;
  return Array.isArray(raw) ? raw.join("/") : raw || "";
});

const path = computed(() => `/guides/${slugParam.value}`);

const { data: guide } = await useAsyncData(
  () => `guide-${path.value}`,
  () => queryContent(path.value).findOne(),
);

const { data: allGuides } = await useAsyncData("guide-nav", () =>
  queryContent("/guides")
    .where({ _extension: "md" })
    .only(["_path", "title", "created_at", "updated_at"])
    .sort({ created_at: -1 })
    .find(),
);

const idx = computed(() => allGuides.value?.findIndex((g) => g._path === guide.value?._path) ?? -1);

const prevLink = computed(() => {
  if (!allGuides.value || idx.value < 0) return null;
  const nextIdx = (idx.value - 1 + allGuides.value.length) % allGuides.value.length;
  return allGuides.value[nextIdx];
});

const nextLink = computed(() => {
  if (!allGuides.value || idx.value < 0) return null;
  const nextIdx = (idx.value + 1) % allGuides.value.length;
  return allGuides.value[nextIdx];
});

const formatDate = (value?: string | number | Date | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU");
};

const tagColor = (index: number) => `tag-${(index % 3) + 1}`;

const bodyRef = ref<HTMLElement | null>(null);
const applyAnchorClasses = () => {
  const el = bodyRef.value;
  if (!el) return;
  const headingAnchors = el.querySelectorAll<HTMLElement>("h1 a, h2 a, h3 a, h4 a, h5 a, h6 a");
  headingAnchors.forEach((a) => a.classList.add("heading-anchor"));
};

onMounted(() => {
  nextTick(applyAnchorClasses);
});

watch(
  () => guide.value?._path,
  () => nextTick(applyAnchorClasses),
);
</script>

<template>
  <main class="guide-page" v-if="guide">
    <header class="guide-hero">
      <div class="hero-cover">
        <img :src="guide.image_url || '/favicon.svg'" :alt="guide.title" />
      </div>
      <div class="hero-content">
        <p class="eyebrow">Guide</p>
        <h1 class="hero-title">
          {{ guide.title || "Без названия" }}
          <span class="hero-author" v-if="guide.author">by {{ guide.author }}</span>
        </h1>
        <p class="hero-desc" v-if="guide.description">
          {{ guide.description }}
        </p>

        <div class="hero-meta">
          <div>
            <span class="label">Обновлено</span>
            <span class="value">{{ formatDate(guide.updated_at || guide.created_at) }}</span>
          </div>
          <div>
            <span class="label">Создано</span>
            <span class="value">{{ formatDate(guide.created_at) }}</span>
          </div>
          <div>
            <span class="label">Путь</span>
            <span class="value mono">{{ guide._path }}</span>
          </div>
        </div>

        <div class="hero-tags" v-if="guide.tags?.length">
          <span
            v-for="(tag, tagIdx) in guide.tags"
            :key="`${guide._path}-tag-${tag}-${tagIdx}`"
            class="tag-pill"
            :class="tagColor(tagIdx)"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </header>

    <section class="guide-body card" ref="bodyRef">
      <ContentRenderer :value="guide" />
    </section>

    <footer class="guide-nav" v-if="prevLink || nextLink">
      <NuxtLink v-if="prevLink" :to="prevLink._path" class="btn ghost"
        >← {{ prevLink.title }}</NuxtLink
      >
      <div class="spacer" />
      <NuxtLink v-if="nextLink" :to="nextLink._path" class="btn primary"
        >{{ nextLink.title }} →</NuxtLink
      >
    </footer>
  </main>

  <main v-else class="guide-page">
    <section class="empty-state card">
      <h2>Гайд не найден</h2>
      <p>Проверьте путь или добавьте MD-файл в content/guides/.</p>
      <NuxtLink to="/guides" class="btn primary">Вернуться к списку</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.guide-page {
  margin-top: 4em;
  padding: 0 0 64px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.guide-hero {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 18px;
  background: var(--color-bg3);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 16px;
  box-shadow: var(--shadow-soft);
}

.hero-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: #0f0f12;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-brand-accent-3);
  font-size: 12px;
  font-weight: 700;
  margin: 0;
}

.hero-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-text-1);
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-author {
  color: var(--color-text-2);
  font-weight: 700;
}

.hero-desc {
  margin: 0;
  color: var(--color-text-2);
}

.hero-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.label {
  display: block;
  color: var(--color-text-2);
  font-size: 0.85rem;
}

.value {
  display: block;
  color: var(--color-text-1);
  font-weight: 700;
}

.mono {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  word-break: break-all;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 10px;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: #111;
  background: #e2e8f0;
}

.tag-1,
.tag-2,
.tag-3 {
  background: var(--color-brand-accent-3);
  color: #ffffff;
}

.guide-body {
  background: var(--color-bg3);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 16px;
}

.guide-body :deep(h1),
.guide-body :deep(h2),
.guide-body :deep(h3) {
  color: var(--color-text-1);
  margin: 18px 0 10px;
}

.guide-body :deep(p) {
  color: var(--color-text-2);
  line-height: 1.6;
}

.guide-body :deep(code) {
  background: #0f172a31;
  padding: 2px 4px;
  border-radius: 6px;
}

.guide-body :deep(pre) {
  background: #0f172a31;
  border-radius: 10px;
  padding: 10px;
  border: 1px solid #ffffff22;
  overflow: auto;
}

.guide-body :deep(a) {
  color: var(--color-text-1);
}

.guide-body :deep(a:not(.heading-anchor)) {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.guide-body :deep(a:not(.heading-anchor):focus-visible) {
  color: var(--color-brand-accent-1);
}

.guide-body :deep(a.heading-anchor) {
  text-decoration: none !important;
  border: none !important;
}

.guide-body :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  border-radius: 10px;
  margin: 12px 0;
}

.card:hover {
  transform: none;
}

.guide-nav {
  display: flex;
  align-items: center;
  gap: 12px;
}

.guide-nav .spacer {
  flex: 1;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background 0.12s ease,
    border-color 0.12s ease,
    transform 0.12s ease;
}

.btn.primary {
  background: var(--color-brand-accent-1);
  border-color: var(--color-brand-accent-2);
  color: #fff;
}

.btn.ghost {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--color-border);
  color: var(--color-text-1);
}

.empty-state {
  background: var(--color-bg3);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px 18px;
  display: grid;
  gap: 8px;
}

@media (max-width: 900px) {
  .guide-hero {
    grid-template-columns: 1fr;
  }

  .hero-cover {
    width: 160px;
    height: 160px;
  }
}
</style>
