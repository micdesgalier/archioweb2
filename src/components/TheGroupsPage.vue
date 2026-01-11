<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { studyGroups, groupMembers, currentUserId, loadStudyGroups, loadGroupMembers, authToken, allUsers } from '@/store/chat.js';
import CreateGroupModal from './CreateGroupModal.vue';
import GroupDetailModal from './GroupDetailModal.vue';

const $q = useQuasar();
const emit = defineEmits(['open-chat', 'session-added']);
const searchQuery = ref('');
const showCreateModal = ref(false);
const selectedGroup = ref(null);
const showGroupDetail = ref(false);

// Get members for a group
function getGroupMembers(groupId) {
  return groupMembers.value.filter(member => {
    const memberGroupId = member.group_id?._id || member.group_id;
    const targetGroupId = groupId?._id || groupId;
    return String(memberGroupId) === String(targetGroupId);
  });
}

// Check if current user is member of group
function isUserMemberOfGroup(groupId) {
  const targetGroupId = groupId?._id || groupId;
  return groupMembers.value.some(member => {
    const memberGroupId = member.group_id?._id || member.group_id;
    const memberUserId = member.user_id?._id || member.user_id;
    return String(memberGroupId) === String(targetGroupId) && 
           String(memberUserId) === String(currentUserId.value);
  });
}

// Get last message info for a group
async function getLastMessageInfo(groupId) {
  try {
    const response = await fetch(`/api/group-messages/${groupId}`, {
      headers: authToken.value ? { 'Authorization': `Bearer ${authToken.value}` } : {}
    });
    if (response.ok) {
      const data = await response.json();
      if (data.lastMessage) {
        const date = new Date(data.lastMessage.timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        let timeStr = '';
        if (diffMins < 1) timeStr = 'À l\'instant';
        else if (diffMins < 60) timeStr = `${diffMins}min`;
        else if (diffHours < 24) timeStr = `${diffHours}h`;
        else if (diffDays < 7) timeStr = `${diffDays}j`;
        else timeStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        
        return {
          text: data.lastMessage.content,
          time: timeStr,
          unread: data.unreadCount || 0
        };
      }
    }
  } catch (err) {
    console.error('Error fetching last message:', err);
  }
  return null;
}

// Generate avatar color based on group name
function getAvatarColor(groupName) {
  const colors = ['#FFD700', '#4CAF50', '#F44336', '#2196F3', '#9C27B0', '#FF9800', '#00BCD4'];
  let hash = 0;
  for (let i = 0; i < groupName.length; i++) {
    hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Get first 3 members for avatar display
function getGroupAvatarMembers(groupId) {
  const members = getGroupMembers(groupId);
  // Return user objects (populated from database)
  return members.slice(0, 3).map(m => {
    const userId = m.user_id?._id || m.user_id;
    // Try to find user in allUsers
    const user = allUsers.value.find(u => {
      const uId = u._id || u.id;
      return String(uId) === String(userId);
    });
    return user || m.user_id;
  });
}

// Build groups list
const groups = computed(() => {
  let result = studyGroups.value.map(async (group) => {
    const members = getGroupMembers(group._id);
    const msgInfo = await getLastMessageInfo(group._id);
    
    // Format session date
    let sessionDate = null;
    let sessionTime = null;
    let sessionTopic = null;
    if (group.start_time && group.end_time) {
      const startDate = new Date(group.start_time);
      sessionDate = startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      sessionTime = `${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(group.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      sessionTopic = group.subject_id?.name || 'Session';
    }
    
    return {
      id: group._id,
      name: group.title,
      description: group.description,
      creator: group.creator_id,
      subject: group.subject_id?.name || 'Général',
      city: group.city_id?.name || (group.is_online ? 'En ligne' : 'Lieu non spécifié'),
      locationDetail: group.location_detail,
      isOnline: group.is_online,
      maxMembers: group.max_members,
      memberCount: members.length,
      members: members,
      isMember: isUserMemberOfGroup(group._id),
      lastMessage: msgInfo?.text || null,
      time: msgInfo?.time || '',
      unread: msgInfo?.unread || 0,
      hasMessages: !!msgInfo,
      hasSession: !!sessionDate,
      sessionDate,
      sessionTime,
      sessionTopic,
      avatarColor: getAvatarColor(group.title),
      avatarMembers: getGroupAvatarMembers(group._id),
      rawGroup: group
    };
  });
  
  // Since we're using async, we need to handle this differently
  // For now, let's make it synchronous and fetch messages separately
  return studyGroups.value.map(group => {
    const members = getGroupMembers(group._id);
    
    // Format session date
    let sessionDate = null;
    let sessionTime = null;
    let sessionTopic = null;
    if (group.start_time && group.end_time) {
      const startDate = new Date(group.start_time);
      sessionDate = startDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      sessionTime = `${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(group.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      sessionTopic = group.subject_id?.name || 'Session';
    }
    
    return {
      id: group._id,
      name: group.title,
      description: group.description,
      creator: group.creator_id,
      subject: group.subject_id?.name || 'Général',
      city: group.city_id?.name || (group.is_online ? 'En ligne' : 'Lieu non spécifié'),
      locationDetail: group.location_detail,
      isOnline: group.is_online,
      maxMembers: group.max_members,
      memberCount: members.length,
      members: members,
      isMember: isUserMemberOfGroup(group._id),
      lastMessage: null, // Will be loaded separately
      time: '',
      unread: 0,
      hasMessages: false,
      hasSession: !!sessionDate,
      sessionDate,
      sessionTime,
      sessionTopic,
      avatarColor: getAvatarColor(group.title),
      avatarMembers: getGroupAvatarMembers(group._id),
      rawGroup: group
    };
  });
});

// Load last messages for all groups
const groupsWithMessages = ref([]);
async function loadGroupsWithMessages() {
  const groupsList = groups.value;
  groupsWithMessages.value = await Promise.all(groupsList.map(async (group) => {
    const msgInfo = await getLastMessageInfo(group.id);
    return {
      ...group,
      lastMessage: msgInfo?.text || null,
      time: msgInfo?.time || '',
      unread: msgInfo?.unread || 0,
      hasMessages: !!msgInfo,
      // Ensure rawGroup is preserved
      rawGroup: group.rawGroup || group
    };
  }));
  
  // Sort: groups user is member of first, then by last message time
  groupsWithMessages.value.sort((a, b) => {
    if (a.isMember !== b.isMember) return a.isMember ? -1 : 1;
    if (a.hasMessages && b.hasMessages) {
      // Sort by time (most recent first) - simplified
      return 0;
    }
    if (a.hasMessages) return -1;
    if (b.hasMessages) return 1;
    return 0;
  });
}

// Filtered groups
const filteredGroups = computed(() => {
  let result = groupsWithMessages.value;
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(g =>
      g.name.toLowerCase().includes(query) ||
      g.description?.toLowerCase().includes(query) ||
      g.subject.toLowerCase().includes(query) ||
      g.city.toLowerCase().includes(query)
    );
  }
  
  return result;
});

function openGroupDetail(group) {
  selectedGroup.value = group;
  showGroupDetail.value = true;
}

function openChat(group) {
  emit('open-chat', {
    ...group,
    type: 'group',
    name: group.name,
    fullName: group.name
  });
}

async function handleGroupCreated() {
  showCreateModal.value = false;
  await loadStudyGroups();
  await loadGroupMembers();
  await loadGroupsWithMessages();
}

function handleJoinGroup() {
  showGroupDetail.value = false;
  // Reload to update membership
  loadGroupMembers();
  loadGroupsWithMessages();
}

// Watch search query to filter groups
watch(searchQuery, () => {
  // Filtering is handled in computed, but we can trigger a reload if needed
});

onMounted(async () => {
  await loadStudyGroups();
  await loadGroupMembers();
  await loadGroupsWithMessages();
});
</script>

<template>
  <div class="groups-page">
    <!-- Header -->
    <header class="groups-header">
      <h1>Groupes</h1>
      <q-icon name="search" class="search-header-icon" />
    </header>

    <!-- Search bar -->
    <div class="search-bar">
      <q-icon name="search" class="search-icon" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher un groupe..."
        class="search-input"
      />
    </div>

    <!-- Groups List -->
    <div class="groups-list">
      <div
        v-for="group in filteredGroups"
        :key="group.id"
        class="group-item"
        @click="openGroupDetail(group)"
      >
        <!-- Avatar -->
        <div class="group-avatar" :style="{ backgroundColor: group.avatarColor }">
          <div class="avatar-faces">
            <div v-for="(member, idx) in group.avatarMembers.slice(0, 3)" :key="idx" class="avatar-face">
              <q-icon name="person" size="16px" />
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="group-content">
          <div class="group-header">
            <span class="group-name">{{ group.name }}</span>
            <div class="group-meta">
              <span v-if="group.unread > 0" class="unread-badge">{{ group.unread }}</span>
              <span v-else-if="group.time" class="group-time">{{ group.time }}</span>
            </div>
          </div>

          <div class="last-message" :class="{ placeholder: !group.hasMessages }">
            {{ group.lastMessage || 'Démarrer une discussion de groupe' }}
          </div>

          <!-- Session preview -->
          <div v-if="group.hasSession" class="session-preview">
            <div class="session-label">Prochaine session</div>
            <div class="session-details">
              <span class="session-topic">{{ group.sessionTopic }}</span>
              <span class="session-date">{{ group.sessionDate }}</span>
              <span class="session-time">{{ group.sessionTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredGroups.length === 0 && !searchQuery" class="no-groups">
        <q-icon name="groups" size="64px" color="grey-4" />
        <p>Aucun groupe</p>
        <span>Les groupes apparaîtront ici</span>
        <button class="create-first-btn" @click="showCreateModal = true">
          Créer le premier groupe
        </button>
      </div>

      <!-- No search results -->
      <div v-if="filteredGroups.length === 0 && searchQuery" class="no-groups">
        <q-icon name="search_off" size="64px" color="grey-4" />
        <p>Aucun résultat</p>
        <span>Aucun groupe ne correspond à "{{ searchQuery }}"</span>
      </div>
    </div>

    <!-- Floating Action Button -->
    <q-btn
      fab
      icon="add"
      color="primary"
      class="fab-create-group"
      @click="showCreateModal = true"
    />

    <!-- Create Group Modal -->
    <CreateGroupModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="handleGroupCreated"
    />

    <!-- Group Detail Modal -->
    <GroupDetailModal
      v-if="selectedGroup"
      :show="showGroupDetail"
      :group="selectedGroup"
      @close="showGroupDetail = false"
      @join="handleJoinGroup"
      @open-chat="openChat"
      @session-added="(session) => { console.log('📅 TheGroupsPage received session-added:', session); emit('session-added', session); }"
    />
  </div>
</template>

<style scoped>
.groups-page {
  background: white;
  min-height: 100vh;
  padding-bottom: 100px;
  position: relative;
}

.groups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #F0F0F0;
}

.groups-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.search-header-icon {
  font-size: 24px;
  color: #666;
  cursor: pointer;
}

.search-bar {
  display: flex;
  align-items: center;
  margin: 12px 16px;
  padding: 12px 16px;
  background: #F5F5F5;
  border-radius: 12px;
}

.search-icon {
  color: #999;
  margin-right: 8px;
  font-size: 20px;
}

.search-input {
  border: none;
  background: transparent;
  flex: 1;
  font-size: 16px;
  color: #1a1a1a;
  outline: none;
}

.search-input::placeholder {
  color: #999;
}

.groups-list {
  padding: 0 16px;
}

.group-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #F0F0F0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-item:last-child {
  border-bottom: none;
}

.group-item:active {
  background: #F9F9F9;
}

.group-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-faces {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px;
}

.avatar-face {
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.group-content {
  flex: 1;
  min-width: 0;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.group-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.unread-badge {
  background: #4A90D9;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.last-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.last-message.placeholder {
  color: #999;
  font-style: italic;
}

.session-preview {
  background: linear-gradient(135deg, #4A90D9 0%, #3B7DC9 100%);
  border-radius: 12px;
  padding: 12px;
  margin-top: 8px;
}

.session-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
  font-weight: 500;
}

.session-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.session-topic,
.session-date,
.session-time {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.no-groups {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.no-groups .q-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-groups p {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1a1a1a;
}

.no-groups span {
  font-size: 14px;
  margin-bottom: 20px;
}

.create-first-btn {
  background: #4A90D9;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.fab-create-group {
  position: fixed;
  bottom: 100px;
  right: 20px;
  z-index: 100;
}

/* Desktop responsive */
@media (min-width: 768px) {
  .groups-page {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .fab-create-group {
    right: calc(50% - 280px);
  }
}
</style>
