<script setup lang="ts">
const { data: guidesRaw } = await useAsyncData("guides-list", () =>
  queryContent("/guides")
    .where({ _extension: "md" })
    .only([
      "_path",
      "title",
      "author",
      "description",
      "image_url",
      "created_at",
      "updated_at",
      "tags",
    ])
    .sort({ created_at: -1 })
    .find(),
);

const formatDate = (value?: string | number | Date | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU");
};

const cards = computed(() =>
  (guidesRaw.value || []).map((item, idx) => ({
    path: item._path,
    title: item.title || `Гайд #${idx + 1}`,
    author: item.author || "Автор",
    description:
      item.description ||
      "Краткое описание гайда. Добавьте description во фронтматтер, чтобы перезаписать это значение.",
    image: item.image_url || "/favicon.svg",
    updatedAt: item.updated_at || item.created_at,
    tags: Array.isArray(item.tags) ? item.tags : [],
  })),
);
</script>

<template>
  <main class="guides-page">
    <header class="guides-header">
      <div>
        <p class="eyebrow">guides.md</p>
        <h1 class="section-title">Гайды и инструкции</h1>
        <p class="muted">
          Здесь собраны гайды на все случаи жизни. Кликните по карточке, чтобы открыть страницу.
        </p>
      </div>
    </header>

    <div v-if="cards.length" class="guides-list">
      <NuxtLink v-for="(guide, idx) in cards" :key="guide.path" :to="guide.path" class="guide-row">
        <div class="guide-thumb">
          <img :src="guide.image" :alt="guide.title" loading="lazy" />
        </div>

        <div class="guide-content">
          <div class="guide-top">
            <div class="title-line">
              <h3 class="guide-title">{{ guide.title }}</h3>
              <span class="guide-author">by {{ guide.author }}</span>
            </div>
            <div class="guide-updated">
              <span class="label">Обновлено:</span>
              <span class="value">{{ formatDate(guide.updatedAt) }}</span>
            </div>
          </div>

          <p class="guide-description">
            {{ guide.description }}
          </p>

          <div class="guide-tags" v-if="guide.tags.length">
            <span
              v-for="(tag, tagIdx) in guide.tags"
              :key="`${guide.path}-${tag}-${tagIdx}`"
              class="tag-pill"
              :class="`tag-${(tagIdx % 3) + 1}`"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <section v-else class="empty-state card">
      <p>
        Пока нет гайдов. Добавьте MD-файлы в content/guides/ с фронтматтером и перезагрузите
        страницу.
      </p>
    </section>
  </main>
</template>

<style scoped>
.guides-page {
  margin-top: 4em;
  padding: 0 0 64px;
}

.guides-header {
  margin-bottom: 18px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-brand-accent-1);
  font-size: 12px;
  font-weight: 700;
  margin: 0 0 6px;
}

.section-title {
  margin: 0 0 6px;
}

.muted {
  margin: 0;
  color: var(--color-text-2);
}

.guides-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.guide-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  padding: 16px 18px;
  background: var(--color-bg3);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  box-shadow: var(--shadow-soft);
  color: inherit;
}

.guide-thumb {
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, rgba(84, 129, 138, 0.16), rgba(115, 148, 155, 0.12));
  border-radius: 16px;
  /* border: 1px solid var(--color-border); */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
}

.guide-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.guide-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.guide-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.title-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.guide-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--color-text-1);
}

.guide-author {
  color: var(--color-text-2);
  font-weight: 700;
  white-space: nowrap;
}

.guide-updated {
  text-align: right;
  color: var(--color-text-2);
  min-width: 120px;
}

.guide-updated .label {
  display: block;
  font-size: 0.85rem;
}

.guide-updated .value {
  font-weight: 800;
  color: var(--color-text-1);
}

.guide-description {
  margin: 0;
  color: var(--color-text-2);
  line-height: 1.5;
}

.guide-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.empty-state {
  margin-top: 24px;
  background: var(--color-bg3);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 16px 18px;
}

@media (max-width: 900px) {
  .guide-row {
    grid-template-columns: 72px 1fr;
    padding: 14px;
  }

  .guide-thumb {
    width: 72px;
    height: 72px;
  }

  .guide-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .guide-updated {
    text-align: left;
  }
}
</style>
