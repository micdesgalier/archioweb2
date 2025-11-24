<script setup>
  const props = defineProps({
    message: {
      type: Object,
      required: true
    }
  });
</script>

<template>
  <span class="q-mr-sm text-grey">[private]</span>
  <span class="username text-weight-bold" :style="{ color: message.fromColor }">
    {{ message.from }}
  </span>
  @
  <span class="username text-weight-bold q-mr-sm">
    <span :style="{ color: message.toColor }">{{ message.to }}</span>:
  </span>
  <span class="message-content">
    {{ message.content }}
  </span>
</template>