<script setup>
import { ref, nextTick, onMounted, watch, computed } from 'vue';
import { privateMessages, currentUsername, sendPrivateMessage, users, loadConversation, markMessagesAsRead } from '@/store/chat.js';
import { useQuasar } from 'quasar';

const props = defineProps({
  discussion: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['back']);

const $q = useQuasar();
const newMessage = ref('');
const messagesContainer = ref(null);
const inputRef = ref(null);
const loading = ref(false);
const sending = ref(false);

// Get conversation partner's name
const partnerName = computed(() => props.discussion.name);

// Check if partner is online (for real-time indicator only)
const isPartnerOnline = computed(() => {
  return users.value.some(user => {
    const userName = typeof user === 'string' ? user : user.name;
    return userName === partnerName.value;
  });
});

// Get messages for this specific conversation
const messages = computed(() => {
  const convMessages = privateMessages.value[partnerName.value] || [];
  return convMessages.map(msg => ({
    id: msg._id || msg.timestamp,
    text: msg.content,
    time: new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    sent: msg.from === currentUsername.value,
    read: msg.read || false,
    username: msg.from,
    type: msg.type
  }));
});

async function sendMessage() {
  if (!newMessage.value.trim() || sending.value) return;
  
  sending.value = true;
  
  try {
    await sendPrivateMessage(partnerName.value, newMessage.value);
    newMessage.value = '';
    inputRef.value?.focus();
    scrollToBottom();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.message || 'Échec de l\'envoi du message',
      timeout: 2000,
      position: 'top',
    });
  } finally {
    sending.value = false;
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function goBack() {
  emit('back');
}

// Watch for new messages in this conversation
watch(() => privateMessages.value[partnerName.value], () => scrollToBottom(), { deep: true });

// Load conversation history on mount
onMounted(async () => {
  loading.value = true;
  try {
    await loadConversation(partnerName.value);
    await markMessagesAsRead(partnerName.value);
  } finally {
    loading.value = false;
  }
  scrollToBottom();
  inputRef.value?.focus();
});
</script>

<template>
  <div class="chat-detail">
    <!-- Header -->
    <header class="chat-header">
      <button class="back-btn" @click="goBack">
        <q-icon name="chevron_left" />
      </button>
      
      <div class="user-info">
        <img :src="discussion.avatar" :alt="discussion.fullName || discussion.name" class="user-avatar" />
        <div class="user-details">
          <span class="user-name">{{ discussion.fullName || discussion.name }}</span>
          <span v-if="isPartnerOnline" class="user-status online">En ligne</span>
          <span v-else class="user-status offline">Hors ligne</span>
        </div>
      </div>
      
      <button class="menu-btn">
        <q-icon name="more_horiz" />
      </button>
    </header>

    <!-- Messages -->
    <div class="messages-container" ref="messagesContainer">
      <!-- Loading indicator -->
      <div v-if="loading" class="loading-messages">
        <q-spinner color="primary" size="32px" />
        <span>Chargement des messages...</span>
      </div>

      <template v-else>
        <div
          v-for="message in messages"
          :key="message.id"
          class="message"
          :class="{ sent: message.sent, received: !message.sent }"
        >
          <div class="message-bubble">
            <p class="message-text">{{ message.text }}</p>
            <div class="message-meta">
              <span class="message-time">{{ message.time }}</span>
              <q-icon 
                v-if="message.sent" 
                :name="message.read ? 'done_all' : 'done'" 
                class="read-indicator"
                :class="{ read: message.read }"
              />
            </div>
          </div>
        </div>

        <div v-if="messages.length === 0" class="no-messages">
          <q-icon name="chat_bubble_outline" size="48px" color="grey-4" />
          <p>Aucun message</p>
          <span>Envoyez un message pour commencer la conversation</span>
        </div>
      </template>
    </div>

    <!-- Input Bar -->
    <div class="input-bar">
      <button class="add-btn">
        <q-icon name="add" />
      </button>
      
      <input
        ref="inputRef"
        v-model="newMessage"
        type="text"
        class="message-input"
        placeholder="Message..."
        :disabled="sending"
        @keyup.enter="sendMessage"
      />
      
      <button 
        class="send-btn" 
        @click="sendMessage" 
        :disabled="!newMessage.trim() || sending"
      >
        <q-icon :name="sending ? 'hourglass_empty' : 'send'" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-detail {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F5F5F5;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #E8E8E8;
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--sc-primary-blue);
}

.back-btn .q-icon {
  font-size: 28px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--sc-text-primary);
}

.user-status {
  font-size: 12px;
}

.user-status.online {
  color: #4CAF50;
}

.user-status.offline {
  color: #9E9E9E;
}

.menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--sc-text-secondary);
}

.menu-btn .q-icon {
  font-size: 24px;
}

/* Messages */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  color: var(--sc-text-secondary);
}

.message {
  display: flex;
  max-width: 80%;
}

.message.sent {
  align-self: flex-end;
}

.message.received {
  align-self: flex-start;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  max-width: 100%;
}

.message.sent .message-bubble {
  background: #DCF8C6;
  border-bottom-right-radius: 4px;
}

.message.received .message-bubble {
  background: white;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-text {
  margin: 0;
  font-size: 15px;
  color: var(--sc-text-primary);
  word-wrap: break-word;
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
}

.message-time {
  font-size: 11px;
  color: var(--sc-text-secondary);
}

.read-indicator {
  font-size: 14px;
  color: #9E9E9E;
}

.read-indicator.read {
  color: #4FC3F7;
}

.no-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--sc-text-secondary);
  text-align: center;
  padding: 20px;
}

.no-messages p {
  margin: 16px 0 4px;
  font-size: 16px;
  color: var(--sc-text-primary);
}

.no-messages span {
  font-size: 14px;
}

/* Input Bar */
.input-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #E8E8E8;
}

.add-btn,
.send-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--sc-text-secondary);
  transition: color 0.2s;
}

.send-btn {
  color: var(--sc-primary-blue);
}

.send-btn:disabled,
.add-btn:disabled {
  color: var(--sc-text-secondary);
  opacity: 0.5;
  cursor: not-allowed;
}

.add-btn .q-icon,
.send-btn .q-icon {
  font-size: 24px;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #E8E8E8;
  border-radius: 24px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus:not(:disabled) {
  border-color: var(--sc-primary-blue);
}

.message-input:disabled {
  background: #EEEEEE;
  cursor: not-allowed;
}

.message-input::placeholder {
  color: var(--sc-text-secondary);
}

/* Desktop Responsive */
@media (min-width: 768px) {
  .chat-detail {
    max-width: 600px;
    margin: 0 auto;
    border-left: 1px solid #E8E8E8;
    border-right: 1px solid #E8E8E8;
  }

  .message {
    max-width: 60%;
  }
}

@media (min-width: 1024px) {
  .chat-detail {
    max-width: 700px;
  }
}
</style>
