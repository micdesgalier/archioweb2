<script setup>
  import { computed } from 'vue';
  import ChatMessageTime from './ChatMessageTime.vue';
  import ChatMessageEmote from './ChatMessageEmote.vue';
  import ChatMessagePm from './ChatMessagePm.vue';
  import ChatMessagePublic from './ChatMessagePublic.vue';

  const { message } = defineProps({
    message: {
      type: Object,
      required: true
    }
  });

  const components = {
    'emote': ChatMessageEmote,
    'pm': ChatMessagePm,
    'message': ChatMessagePublic,
  };
  const messageComponent = computed(() => components[message.type] ?? ChatMessagePublic);
</script>

<template>
  <div class="message-item q-mb-xs row items-center">
    <ChatMessageTime :timestamp="message.timestamp" />
    <component :is="messageComponent" :message="message" />
  </div>
</template>

<style scoped>
  .username {
    font-size: 0.9rem;
  }

  .message-content {
    line-height: 1.4;
    word-wrap: break-word;
  }
</style>
