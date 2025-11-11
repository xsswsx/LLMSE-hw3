<script setup lang="ts">
</script>

<template>
  <div class="app-container">
    <router-view class="overall-container"></router-view>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
}

.overall-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  min-height: 100vh;
}
</style>
