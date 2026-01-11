<script setup>
import { ref, computed, onMounted } from 'vue';
import { users, allUsers, privateMessages, currentUsername, currentUserId, loadConversations, loadAllUsers } from '@/store/chat.js';
import avatarAliceAnalyse from '@/assets/aliceanalyse.png';
import avatarBob from '@/assets/bob.png';
import avatarCaroline from '@/assets/caroline.png';
import avatarDavid from '@/assets/david.png';
import avatarEmilie from '@/assets/emilie.png';

const emit = defineEmits(['open-chat']);
const searchQuery = ref('');

// Get last message info for a user
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

// Check if user is online (connected to WebSocket)
function isUserOnline(username) {
  return users.value.some(user => {
    const userName = typeof user === 'string' ? user : user.name;
    return userName === username;
  });
}

// Build discussions list from database users
const discussions = computed(() => {
  // Get all users from database except current user
  let result = allUsers.value
    .filter(user => user._id !== currentUserId.value)
    .map(user => {
      const userName = user.first_name;
      const msgInfo = getLastMessageInfo(userName);
      
      // Use special images for specific users
      let avatarUrl = user.avatar_url || `https://i.pravatar.cc/100?u=${user._id}`;
      const firstName = user.first_name?.toLowerCase();
      
      if (user.first_name === 'Alice' || user.email === 'alice.dupont@example.com') {
        avatarUrl = avatarAliceAnalyse;
      } else if (firstName === 'bob') {
        avatarUrl = avatarBob;
      } else if (firstName === 'caroline') {
        avatarUrl = avatarCaroline;
      } else if (firstName === 'david') {
        avatarUrl = avatarDavid;
      } else if (firstName === 'émilie' || firstName === 'emilie') {
        avatarUrl = avatarEmilie;
      }
      
      return {
        id: user._id,
        name: `${user.first_name} ${user.last_name}`,
        partnerName: userName, // First name used for messages
        fullName: `${user.first_name} ${user.last_name}`,
        email: user.email,
        avatar: avatarUrl,
        lastMessage: msgInfo?.text || 'Démarrer une conversation',
        time: msgInfo?.time || '',
        unread: 0,
        online: isUserOnline(userName),
        hasMessages: !!msgInfo
      };
    });
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(d => 
      d.name.toLowerCase().includes(query) || 
      d.fullName.toLowerCase().includes(query) ||
      d.email?.toLowerCase().includes(query)
    );
  }
  
  // Sort: users with messages first, then online, then alphabetically
  result.sort((a, b) => {
    // Users with messages first
    if (a.hasMessages !== b.hasMessages) return a.hasMessages ? -1 : 1;
    // Then online users
    if (a.online !== b.online) return a.online ? -1 : 1;
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });
  
  return result;
});

function openChat(discussion) {
  emit('open-chat', discussion);
}

onMounted(async () => {
  await loadAllUsers();
  await loadConversations();
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

    <!-- Search bar -->
    <div class="search-bar">
      <q-icon name="search" class="search-icon" />
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Rechercher un utilisateur..."
        class="search-input"
      />
    </div>

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
            <span class="discussion-name">{{ discussion.fullName }}</span>
            <span class="discussion-time">{{ discussion.time }}</span>
          </div>
          <div class="discussion-preview">
            <span class="last-message" :class="{ placeholder: !discussion.hasMessages }">
              {{ discussion.lastMessage }}
            </span>
            <span v-if="discussion.unread > 0" class="unread-badge">
              {{ discussion.unread }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="discussions.length === 0 && !searchQuery" class="no-discussions">
        <q-icon name="people" size="64px" color="grey-4" />
        <p>Aucun utilisateur</p>
        <span>Les utilisateurs apparaîtront ici</span>
      </div>

      <!-- No search results -->
      <div v-if="discussions.length === 0 && searchQuery" class="no-discussions">
        <q-icon name="search_off" size="64px" color="grey-4" />
        <p>Aucun résultat</p>
        <span>Aucun utilisateur ne correspond à "{{ searchQuery }}"</span>
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

.search-bar {
  display: flex;
  align-items: center;
  margin: 0 16px 12px;
  padding: 10px 16px;
  background: #F5F5F5;
  border-radius: 12px;
  gap: 10px;
}

.search-icon {
  font-size: 20px;
  color: var(--sc-text-secondary);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  outline: none;
}

.search-input::placeholder {
  color: var(--sc-text-secondary);
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

.last-message.placeholder {
  color: #BDBDBD;
  font-style: italic;
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

.no-discussions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--sc-text-secondary);
  text-align: center;
}

.no-discussions p {
  margin: 16px 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--sc-text-primary);
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

  .search-bar {
    margin: 0 24px 12px;
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