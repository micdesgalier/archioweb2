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

const emit = defineEmits(['back', 'session-accepted']);

const $q = useQuasar();
const newMessage = ref('');
const messagesContainer = ref(null);
const inputRef = ref(null);
const loading = ref(false);
const sending = ref(false);

// Attachment menu
const showAttachMenu = ref(false);
const fileInput = ref(null);
const imageInput = ref(null);
const cameraInput = ref(null);

// Session proposal in chat
const showSessionModal = ref(false);
const sessionSubject = ref('');
const sessionDate = ref('');
const sessionTimeStart = ref('');
const sessionTimeEnd = ref('');

const subjects = [
  'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Programmation',
  'Algèbre linéaire', 'Analyse', 'Français', 'Anglais', 'Allemand',
  'Histoire', 'Géographie', 'Économie', 'Droit', 'Marketing',
  'Gestion de projet', 'UX/UI Design', 'Autre'
];

// Get conversation partner's name (use partnerName if available, otherwise use name)
const partnerName = computed(() => props.discussion.partnerName || props.discussion.name);

// Check if partner is online (for real-time indicator only)
const isPartnerOnline = computed(() => {
  return users.value.some(user => {
    const userName = typeof user === 'string' ? user : user.name;
    return userName === partnerName.value;
  });
});

// Parse session proposal from message content
function parseSessionProposal(content) {
  if (content?.startsWith('[SESSION_PROPOSAL]')) {
    try {
      const jsonStr = content.replace('[SESSION_PROPOSAL]', '');
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Get messages for this specific conversation
const messages = computed(() => {
  const convMessages = privateMessages.value[partnerName.value] || [];
  return convMessages.map(msg => {
    const sessionProposal = parseSessionProposal(msg.content);
    return {
      id: msg._id || msg.timestamp,
      text: sessionProposal ? null : msg.content,
      sessionProposal,
      time: new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      sent: msg.from === currentUsername.value,
      read: msg.read || false,
      username: msg.from,
      type: msg.type
    };
  });
});

// Accept session proposal
async function acceptSession(message) {
  try {
    // Send acceptance message
    await sendPrivateMessage(partnerName.value, `[SESSION_ACCEPTED]${JSON.stringify(message.sessionProposal)}`);
    
    // Emit event to add to calendar (will be handled by parent)
    emit('session-accepted', {
      ...message.sessionProposal,
      partner: partnerName.value
    });
    
    $q.notify({
      type: 'positive',
      message: 'Session acceptée et ajoutée au calendrier !',
      timeout: 2000,
      position: 'top',
    });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'acceptation',
      timeout: 2000,
      position: 'top',
    });
  }
}

// Decline session proposal
async function declineSession(message) {
  try {
    await sendPrivateMessage(partnerName.value, `[SESSION_DECLINED]${JSON.stringify(message.sessionProposal)}`);
    
    $q.notify({
      type: 'info',
      message: 'Session refusée',
      timeout: 2000,
      position: 'top',
    });
  } catch (err) {
    console.error('Error declining session:', err);
  }
}

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

// Attachment functions
function openFilePicker() {
  fileInput.value?.click();
}

function openImagePicker() {
  imageInput.value?.click();
}

function openCamera() {
  cameraInput.value?.click();
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    // TODO: Upload file and send as message
    $q.notify({
      type: 'info',
      message: `Fichier sélectionné: ${file.name}`,
      caption: 'Upload en cours de développement',
      timeout: 2000
    });
  }
  event.target.value = '';
}

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    // TODO: Upload image and send as message
    $q.notify({
      type: 'info',
      message: `Image sélectionnée: ${file.name}`,
      caption: 'Upload en cours de développement',
      timeout: 2000
    });
  }
  event.target.value = '';
}

function handleCameraCapture(event) {
  const file = event.target.files[0];
  if (file) {
    // TODO: Upload photo and send as message
    $q.notify({
      type: 'info',
      message: 'Photo capturée',
      caption: 'Upload en cours de développement',
      timeout: 2000
    });
  }
  event.target.value = '';
}

// Session proposal from chat
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('/');
  return `${day}.${month}.${year}`;
}

async function sendSessionProposalFromChat() {
  if (!sessionSubject.value || !sessionDate.value || !sessionTimeStart.value || !sessionTimeEnd.value) {
    $q.notify({
      type: 'warning',
      message: 'Veuillez remplir tous les champs',
      timeout: 2000
    });
    return;
  }
  
  const sessionMessage = {
    type: 'session_proposal',
    title: partnerName.value,
    subject: sessionSubject.value,
    date: sessionDate.value,
    dateFormatted: formatDateForDisplay(sessionDate.value),
    timeRange: `${sessionTimeStart.value} - ${sessionTimeEnd.value}`,
    status: 'pending'
  };
  
  const messageContent = `[SESSION_PROPOSAL]${JSON.stringify(sessionMessage)}`;
  
  try {
    await sendPrivateMessage(partnerName.value, messageContent);
    showSessionModal.value = false;
    
    // Reset form
    sessionSubject.value = '';
    sessionDate.value = '';
    sessionTimeStart.value = '';
    sessionTimeEnd.value = '';
    
    $q.notify({
      type: 'positive',
      message: 'Proposition envoyée !',
      timeout: 2000
    });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'envoi',
      timeout: 2000
    });
  }
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
          <!-- Session Proposal Card -->
          <div v-if="message.sessionProposal" class="session-proposal-card">
            <div class="proposal-header">
              <span class="proposal-title">{{ message.sessionProposal.title || partnerName }}</span>
              <div class="proposal-date-time">
                <span class="proposal-date">{{ message.sessionProposal.dateFormatted }}</span>
                <span class="proposal-time">{{ message.sessionProposal.timeRange }}</span>
              </div>
            </div>
            <div class="proposal-subject">
              <span>{{ message.sessionProposal.subject }}</span>
            </div>
            <!-- Accept/Decline buttons for received proposals -->
            <div v-if="!message.sent && message.sessionProposal.status === 'pending'" class="proposal-actions">
              <button class="decline-btn" @click="declineSession(message)">
                <q-icon name="close" size="18px" />
                Refuser
              </button>
              <button class="accept-btn" @click="acceptSession(message)">
                <q-icon name="check" size="18px" />
                Accepter
              </button>
            </div>
            <div v-else-if="message.sent" class="proposal-status sent-status">
              <q-icon name="schedule" size="16px" />
              Proposition envoyée
            </div>
            <div class="message-meta">
              <span class="message-time">{{ message.time }}</span>
            </div>
          </div>

          <!-- Regular Message Bubble -->
          <div v-else class="message-bubble">
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
      <button class="add-btn" @click="showAttachMenu = !showAttachMenu">
        <q-icon name="add" />
        
        <!-- Attachment Menu -->
        <q-menu v-model="showAttachMenu" anchor="top left" self="bottom left">
          <q-list style="min-width: 200px">
            <q-item clickable v-close-popup @click="openFilePicker">
              <q-item-section avatar>
                <q-icon name="attach_file" color="primary" />
              </q-item-section>
              <q-item-section>Fichier</q-item-section>
            </q-item>
            
            <q-item clickable v-close-popup @click="openImagePicker">
              <q-item-section avatar>
                <q-icon name="image" color="green" />
              </q-item-section>
              <q-item-section>Photo</q-item-section>
            </q-item>
            
            <q-item clickable v-close-popup @click="openCamera">
              <q-item-section avatar>
                <q-icon name="camera_alt" color="orange" />
              </q-item-section>
              <q-item-section>Prendre une photo</q-item-section>
            </q-item>
            
            <q-separator />
            
            <q-item clickable v-close-popup @click="showSessionModal = true">
              <q-item-section avatar>
                <q-icon name="event" color="blue" />
              </q-item-section>
              <q-item-section>Proposer une session</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </button>
      
      <!-- Hidden file inputs -->
      <input 
        type="file" 
        ref="fileInput" 
        style="display: none" 
        @change="handleFileSelect"
      />
      <input 
        type="file" 
        ref="imageInput" 
        accept="image/*" 
        style="display: none" 
        @change="handleImageSelect"
      />
      <input 
        type="file" 
        ref="cameraInput" 
        accept="image/*" 
        capture="environment" 
        style="display: none" 
        @change="handleCameraCapture"
      />
      
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

    <!-- Session Proposal Dialog -->
    <q-dialog v-model="showSessionModal">
      <q-card style="min-width: 350px; border-radius: 16px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Proposer une session</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-mb-md q-pa-sm" style="background: #F0F7FF; border-radius: 8px; color: #4A90D9;">
            <q-icon name="person" size="20px" class="q-mr-sm" />
            À : <strong>{{ partnerName }}</strong>
          </div>

          <q-select
            v-model="sessionSubject"
            :options="subjects"
            label="Matière *"
            outlined
            dense
            class="q-mb-md"
          />

          <q-input
            v-model="sessionDate"
            label="Date *"
            outlined
            dense
            class="q-mb-md"
            mask="####/##/##"
            placeholder="2026/03/18"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="sessionDate" mask="YYYY/MM/DD" first-day-of-week="1">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="OK" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <div class="row q-gutter-sm">
            <q-input
              v-model="sessionTimeStart"
              label="Début *"
              outlined
              dense
              class="col"
              mask="##:##"
              placeholder="14:00"
            >
              <template v-slot:append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="sessionTimeStart" mask="HH:mm" format24h>
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="OK" color="primary" flat />
                      </div>
                    </q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-input
              v-model="sessionTimeEnd"
              label="Fin *"
              outlined
              dense
              class="col"
              mask="##:##"
              placeholder="16:30"
            >
              <template v-slot:append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="sessionTimeEnd" mask="HH:mm" format24h>
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="OK" color="primary" flat />
                      </div>
                    </q-time>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pt-none">
          <q-btn flat label="Annuler" v-close-popup />
          <q-btn 
            unelevated 
            label="Envoyer" 
            color="primary" 
            @click="sendSessionProposalFromChat"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
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

/* Session Proposal Card */
.session-proposal-card {
  background: linear-gradient(135deg, #4A90D9 0%, #6BA8E8 100%);
  border-radius: 16px;
  padding: 16px;
  min-width: 260px;
  max-width: 320px;
  color: white;
}

.proposal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.proposal-title {
  font-weight: 700;
  font-size: 16px;
}

.proposal-date-time {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.proposal-date,
.proposal-time {
  background: white;
  color: var(--sc-text-primary);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.proposal-subject {
  margin-bottom: 12px;
}

.proposal-subject span {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  display: inline-block;
}

.proposal-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.proposal-actions button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.2s;
}

.proposal-actions button:hover {
  transform: scale(1.02);
}

.decline-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.accept-btn {
  background: white;
  color: #22C55E;
}

.proposal-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.8;
  margin-top: 8px;
}

.sent-status {
  justify-content: flex-end;
}

.session-proposal-card .message-meta {
  margin-top: 8px;
}

.session-proposal-card .message-time {
  color: rgba(255, 255, 255, 0.8);
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
