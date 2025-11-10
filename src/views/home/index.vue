<script setup lang="ts">
import { ref } from 'vue'
 
defineProps({
  msg: String,
})
 
const count = ref(0)
</script>
<template>
  <div class="home-page">home page</div>
</template>
<style scoped>
.home-page{
  color:$color-195CC2;
}
</style>