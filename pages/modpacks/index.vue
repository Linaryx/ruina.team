<script setup lang="ts">
// @ts-ignore Nuxt auto-imports from #imports
import { useAsyncData, queryContent } from "#imports";

const { data: modpacksIntro } = await useAsyncData("modpacks-intro", () =>
  queryContent("/modpacks").findOne(),
);

const { data: modpacksRaw } = await useAsyncData("modpacks", () =>
  queryContent("/modpacks").only(["_path", "title", "description"]).find(),
);

const modpacks = computed(() =>
  (modpacksRaw.value || []).filter((item) => item._path && item._path !== "/modpacks"),
);
</script>

<template>
  <main class="site-page modpacks-page">
    <header class="page-intro modpacks-header">
      <h1 class="section-title">
        {{ modpacksIntro?.title || "Сборки" }}
      </h1>
      <p class="muted">
        {{ modpacksIntro?.description || "Каталог сборок и связанных инструкций." }}
      </p>
    </header>

    <div v-if="modpacks.length" class="modpacks-list">
      <NuxtLink v-for="item in modpacks" :key="item._path" :to="item._path" class="modpack-link">
        <span class="modpack-title">{{ item.title }}</span>
        <span class="modpack-description">{{ item.description }}</span>
      </NuxtLink>
    </div>

    <section v-else class="empty-state">
      <h2>Пока пусто</h2>
      <p>
        Отдельные страницы модпаков ещё не добавлены. Когда они появятся в `content/modpacks/`,
        список соберётся автоматически без дополнительной настройки.
      </p>
    </section>
  </main>
</template>

<style scoped>
.modpacks-page {
  gap: 18px;
}

.modpacks-header {
  max-width: 680px;
}

.muted {
  margin: 0;
  color: var(--color-text-2);
  line-height: 1.6;
}

.modpacks-list {
  display: grid;
  gap: 10px;
}

.modpack-link {
  display: grid;
  gap: 4px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: inherit;
  transition:
    border-color 0.12s ease,
    color 0.12s ease;
}

.modpack-link:hover {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.16);
}

.modpack-title {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.modpack-description {
  color: var(--color-text-2);
  line-height: 1.5;
}

.empty-state {
  padding: 8px 0 0;
}

.empty-state h2 {
  margin: 0 0 6px;
  font-size: 1.05rem;
}

.empty-state p {
  max-width: 720px;
  margin: 0;
  color: var(--color-text-2);
  line-height: 1.6;
}
</style>
