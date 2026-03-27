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
    <header class="page-intro">
      <p class="eyebrow">modpacks/</p>
      <h1 class="section-title">
        {{ modpacksIntro?.title || "Модпаки" }}
      </h1>
      <p class="muted">
        {{ modpacksIntro?.description || "Здесь будут модпак-гайды и инструкции по установке." }}
      </p>
    </header>

    <div v-if="modpacks.length" class="card-grid">
      <NuxtLink v-for="item in modpacks" :key="item._path" :to="item._path" class="card">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </NuxtLink>
    </div>

    <section v-else class="surface-panel surface-panel--padded empty-state">
      <p>
        Отдельные страницы модпаков пока не добавлены. Когда они появятся в `content/modpacks/`,
        список соберётся автоматически.
      </p>
    </section>
  </main>
</template>

<style scoped>
.modpacks-page {
  gap: 18px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-brand-accent-1);
  font-size: 12px;
  font-weight: 700;
  margin: 0;
}

.muted {
  margin: 0;
  color: var(--color-text-2);
}

.empty-state p {
  margin: 0;
  color: var(--color-text-2);
}
</style>
