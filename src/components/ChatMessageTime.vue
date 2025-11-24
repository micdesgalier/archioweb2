<script setup>
  const props = defineProps({
    timestamp: {
      type: Number,
      required: true
    }
  });

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-CH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<template>
  <span class="timestamp text-caption text-grey q-mr-sm">
    {{ formatTime(timestamp) }}
  </span>
</template>

<style scoped>
  .timestamp {
    font-size: 0.75rem;
  }
</style>
