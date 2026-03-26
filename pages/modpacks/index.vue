<script setup lang="ts">
// @ts-ignore Nuxt auto-imports from #imports
import { useAsyncData, queryContent } from "#imports";

const { data: modpacks } = await useAsyncData("modpacks", () =>
  queryContent("/modpacks").only(["_path", "title", "description"]).find(),
);
</script>

<template>
  <main>
    <h1 class="section-title">Модпаки</h1>
    <div class="card-grid">
      <NuxtLink v-for="item in modpacks" :key="item._path" :to="item._path" class="card">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </NuxtLink>
    </div>
  </main>
</template>
