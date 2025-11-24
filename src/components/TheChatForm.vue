<script setup>
  import { ref, onMounted } from 'vue';
  import { useQuasar } from 'quasar';
  import { ws } from '@/store/chat.js';

  const $q = useQuasar();
  const message = ref('');
  const inputMsg = ref(null);

  function sendRpcCommand(command) {
    const [cmd, ...content] = command.split(' ');
    const data = content.join(' ');

    ws.rpc(cmd, data)
      .then((response) => {
        message.value = '';
        inputMsg.value.focus();
      })
      .catch((err) => {
        if (err.message === 'Unknown rpc') err.message = `Unknown command: ${cmd}`;
        $q.notify({
          type: 'negative',
          message:  err.message,
          timeout: 2000,
          position: 'top',
        });
      });
  }

  function sendChatMessage(content) {
    ws.pub('chat', {content})
      .then(() => {
        message.value = '';
        inputMsg.value.focus();
      })
      .catch((err) => {
        $q.notify({
          type: 'negative',
          message: 'Failed to send message. Please try again.',
          timeout: 2000,
          position: 'top',
        });
      });
  }

  function handleSubmit() {
    if (!message.value.trim()) return;

    if (message.value.startsWith('/')) {
      sendRpcCommand(message.value);
    } else {
      sendChatMessage(message.value);
    }
  }

  onMounted(() => inputMsg.value.focus());
</script>

<template>
  <q-form @submit.prevent="handleSubmit" class="chat-form">
    <q-input
      ref="inputMsg"
      filled
      dense
      maxlength="500"
      v-model.trim="message"
      label="Message"
      class="full-width"
      autocomplete="off"
    />
  </q-form>
</template>

<style scoped>
  .chat-form {
    width: 100%;
  }
</style>