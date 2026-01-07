<script setup>
import { ref, computed, onMounted } from 'vue';
import { users, privateMessages, currentUsername, loadConversations } from '@/store/chat.js';

const emit = defineEmits(['open-chat']);
const searchQuery = ref('');

// Demo conversations data (like the mockup)
const demoConversations = [
  {
    id: 'demo-1',
    name: 'Jacob Carder',
    avatar: 'https://i.pravatar.cc/100?img=11',
    lastMessage: 'Yo, tu vas bien ?',
    time: '16:11',
    unread: 1
  },
  {
    id: 'demo-2',
    name: 'Sarah Posli',
    avatar: 'https://i.pravatar.cc/100?img=5',
    lastMessage: 'Salut! Comment tu vas ?',
    time: '11:01',
    unread: 0
  },
  {
    id: 'demo-3',
    name: 'Groupe HEIG-VD',
    avatar: 'https://i.pravatar.cc/100?img=12',
    lastMessage: 'ok, on fait comme ça',
    time: '17:30',
    unread: 0,
    isGroup: true
  },
  {
    id: 'demo-4',
    name: 'Lausanne - Math',
    avatar: 'https://i.pravatar.cc/100?img=13',
    lastMessage: 'Non du tout',
    time: '10:00',
    unread: 10,
    isGroup: true
  },
  {
    id: 'demo-5',
    name: 'Valentina Ciappi',
    avatar: 'https://i.pravatar.cc/100?img=9',
    lastMessage: 'Tu es en route ?',
    time: '16:47',
    unread: 16
  },
  {
    id: 'demo-6',
    name: 'Jack Bolvis',
    avatar: 'https://i.pravatar.cc/100?img=3',
    lastMessage: 'Hello, tu vas bien ?',
    time: '12:00',
    unread: 0
  },
  {
    id: 'demo-7',
    name: 'Sam Karter',
    avatar: 'https://i.pravatar.cc/100?img=7',
    lastMessage: 'Merci beaucoup !',
    time: '14:12',
    unread: 0
  },
  {
    id: 'demo-8',
    name: 'Daniel Silva',
    avatar: 'https://i.pravatar.cc/100?img=8',
    lastMessage: 'Pas de soucis tqt pas',
    time: '15:13',
    unread: 0
  }
];

// Get last message info for a user from real messages
function getLastMessageInfo(username) {
  const messages = privateMessages.value[username];
  if (!messages || messages.length === 0) {
    return null;
  }
  
  const lastMsg = messages[messages.length - 1];
  const time = new Date(lastMsg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const prefix = lastMsg.from === currentUsername.value ? 'Vous: ' : '';
  
  return { 
    text: prefix + lastMsg.content, 
    time
  };
}

// Check if user is online
function isUserOnline(username) {
  return users.value.some(user => {
    const userName = typeof user === 'string' ? user : user.name;
    return userName === username;
  });
}

// Combine demo data with real conversations
const discussions = computed(() => {
  // Start with demo conversations
  let result = demoConversations.map(demo => {
    // Check if we have real messages with this person
    const realMsgInfo = getLastMessageInfo(demo.name);
    
    return {
      ...demo,
      lastMessage: realMsgInfo?.text || demo.lastMessage,
      time: realMsgInfo?.time || demo.time,
      online: isUserOnline(demo.name)
    };
  });
  
  // Add any real conversations not in demo data
  Object.keys(privateMessages.value).forEach(partner => {
    if (partner === currentUsername.value) return;
    
    // Skip if already in demo data
    const inDemo = demoConversations.some(d => d.name === partner);
    if (inDemo) return;
    
    const msgInfo = getLastMessageInfo(partner);
    if (msgInfo) {
      result.push({
        id: `real-${partner}`,
        name: partner,
        avatar: `https://i.pravatar.cc/100?u=${partner}`,
        lastMessage: msgInfo.text,
        time: msgInfo.time,
        unread: 0,
        online: isUserOnline(partner)
      });
    }
  });
  
  // Add online users not in the list yet
  users.value.forEach(user => {
    const userName = typeof user === 'string' ? user : user.name;
    if (userName === currentUsername.value) return;
    
    const exists = result.some(d => d.name === userName);
    if (exists) return;
    
    const msgInfo = getLastMessageInfo(userName);
    result.push({
      id: `online-${userName}`,
      name: userName,
      avatar: `https://i.pravatar.cc/100?u=${userName}`,
      lastMessage: msgInfo?.text || 'En ligne',
      time: msgInfo?.time || '',
      unread: 0,
      online: true
    });
  });
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(d => d.name.toLowerCase().includes(query));
  }
  
  return result;
});

function openChat(discussion) {
  emit('open-chat', discussion);
}

onMounted(() => {
  loadConversations();
});
</script>

<template>
  <div class="discussions-page">
    <!-- Header -->
    <header class="discussions-header">
      <h1>Discussions</h1>
      <button class="search-btn">
        <q-icon name="search" />
      </button>
    </header>

    <!-- Discussions List -->
    <div class="discussions-list">
      <div
        v-for="discussion in discussions"
        :key="discussion.id"
        class="discussion-item"
        @click="openChat(discussion)"
      >
        <div class="avatar-container">
          <img :src="discussion.avatar" :alt="discussion.name" class="avatar" />
          <span v-if="discussion.online" class="online-indicator"></span>
        </div>

        <div class="discussion-content">
          <div class="discussion-header">
            <span class="discussion-name">{{ discussion.name }}</span>
            <span class="discussion-time">{{ discussion.time }}</span>
          </div>
          <div class="discussion-preview">
            <span class="last-message">{{ discussion.lastMessage }}</span>
            <span v-if="discussion.unread > 0" class="unread-badge">
              {{ discussion.unread }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.discussions-page {
  background: white;
  min-height: 100vh;
  padding-bottom: 80px;
}

.discussions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.discussions-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--sc-text-primary);
  margin: 0;
}

.search-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--sc-text-secondary);
}

.search-btn .q-icon {
  font-size: 24px;
}

.discussions-list {
  padding: 0 16px;
}

.discussion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  cursor: pointer;
  border-bottom: 1px solid #F5F5F5;
  transition: background 0.2s;
}

.discussion-item:hover {
  background: #FAFAFA;
}

.discussion-item:active {
  background: #F0F0F0;
}

.avatar-container {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  background: #4CAF50;
  border: 3px solid white;
  border-radius: 50%;
}

.discussion-content {
  flex: 1;
  min-width: 0;
}

.discussion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.discussion-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--sc-text-primary);
}

.discussion-time {
  font-size: 13px;
  color: var(--sc-text-secondary);
}

.discussion-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.last-message {
  font-size: 14px;
  color: var(--sc-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.unread-badge {
  background: var(--sc-primary-blue);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 22px;
  text-align: center;
  flex-shrink: 0;
}

/* Desktop Responsive */
@media (min-width: 768px) {
  .discussions-page {
    max-width: 600px;
    margin: 0 auto;
    border-left: 1px solid #E8E8E8;
    border-right: 1px solid #E8E8E8;
  }

  .discussions-header {
    padding: 20px 24px;
  }

  .discussions-list {
    padding: 0 24px;
  }
}

@media (min-width: 1024px) {
  .discussions-page {
    max-width: 700px;
  }
}
</style>
