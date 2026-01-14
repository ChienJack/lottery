<template>
  <div class="layout" :class="{ 'audience-layout': isAudience }">
    <header v-if="!isAudience">
      <h1>Lottery Console</h1>
      <nav>
        <RouterLink to="/">操作者模式</RouterLink>
        <RouterLink to="/audience">觀眾模式</RouterLink>
      </nav>
    </header>
    <main class="page" :class="{ 'audience-page': isAudience }">
      <RouterView />
    </main>
  </div>
  </template>

<script lang="ts">
import { defineComponent } from 'vue';
import { RouterLink, RouterView } from 'vue-router';

export default defineComponent({
  name: 'App',
  components: {
    RouterLink,
    RouterView,
  },
  computed: {
    isAudience(): boolean {
      return this.$route.name === 'audience';
    },
  },
});
</script>
