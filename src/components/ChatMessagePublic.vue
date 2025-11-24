<script setup>
  const props = defineProps({
    message: {
      type: Object,
      required: true
    }
  });
</script>

<template>
  <span class="username text-weight-bold q-mr-sm">
    <span :style="{ color: message.color }">{{ message.username }}</span>:
  </span>
  <span class="message-content">
    {{ message.content }}
  </span>
</template>