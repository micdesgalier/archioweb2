<script setup>
  const props = defineProps({
    message: {
      type: Object,
      required: true
    }
  });
</script>

<template>
  <span class="emote-message text-italic" :style="{ color: message.color }">
    {{ message.username }} {{ message.content }}
  </span>
</template>

<style scoped>
  .emote-message {
    line-height: 1.4;
    word-wrap: break-word;
  }
</style>
