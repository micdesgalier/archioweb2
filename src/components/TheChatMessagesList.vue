<script setup>
  import { ref, nextTick, watch } from 'vue';
  import { allMsg } from '@/store/chat.js';
  import ChatMessage from './ChatMessage.vue';

  const chatContainer = ref(null);

  async function scrollToBottom() {
    await nextTick();
    const lastMessage = chatContainer.value?.lastElementChild;
    if (!lastMessage) return;
    lastMessage.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }

  watch(allMsg, () => scrollToBottom(), { deep: true });
</script>

<template>
  <div ref="chatContainer" class="chat-messages-list">
    <ChatMessage
      v-for="message in allMsg"
      :key="message.timestamp"
      :message="message"
    />
  </div>
</template>

<style scoped>
  .chat-messages-list {
    height: 100%;
    overflow-y: auto;
    scroll-behavior: smooth;
  }
</style>