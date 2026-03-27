<script setup lang="ts">
const props = defineProps<{ hero?: boolean }>();
</script>

<template>
  <header :class="['nav', { 'nav--hero': props.hero, 'nav--floating': props.hero }]">
    <NuxtLink class="nav-brand" to="/">
      <span class="brand">
        <span class="brand-icon" aria-hidden="true"></span>
        <span class="nav-logo">Ruina.team</span>
      </span>
    </NuxtLink>
    <nav class="nav-links">
      <NuxtLink to="/guides">Руководства</NuxtLink>
      <NuxtLink to="/modpacks">Сборки модов</NuxtLink>
      <NuxtLink to="/chat-tiers">Рейтинг чата</NuxtLink>
    </nav>
  </header>
</template>
