<script setup>
import { ref, computed, onMounted } from 'vue';
import { studyGroups, groupMembers, currentUserId, loadStudyGroups, loadGroupMembers } from '@/store/chat.js';

const emit = defineEmits(['open-chat']);
const searchQuery = ref('');

// Get members for a group
function getGroupMembers(groupId) {
  return groupMembers.value.filter(member => member.group_id._id === groupId);
}

// Check if current user is member of group
function isUserMemberOfGroup(groupId) {
  return groupMembers.value.some(member =>
    member.group_id._id === groupId && member.user_id._id === currentUserId.value
  );
}

// Get last message info for a group (placeholder for now)
function getLastMessageInfo(groupId) {
  // TODO: Implement when group messaging is added
  return null;
}

// Build groups list
const groups = computed(() => {
  let result = studyGroups.value.map(group => {
    const members = getGroupMembers(group._id);
    const msgInfo = getLastMessageInfo(group._id);

    return {
      id: group._id,
      name: group.title,
      description: group.description,
      creator: group.creator_id,
      subject: group.subject_id?.name || 'Général',
      city: group.city_id?.name || (group.is_online ? 'En ligne' : 'Lieu non spécifié'),
      isOnline: group.is_online,
      maxMembers: group.max_members,
      memberCount: members.length,
      members: members,
      isMember: isUserMemberOfGroup(group._id),
      lastMessage: msgInfo?.text || 'Démarrer une discussion de groupe',
      time: msgInfo?.time || '',
      unread: 0,
      hasMessages: !!msgInfo,
      // Session info (placeholder)
      hasSession: group.start_time && group.end_time,
      sessionDate: group.start_time ? new Date(group.start_time).toLocaleDateString('fr-FR') : null,
      sessionTime: group.start_time && group.end_time ?
        `${new Date(group.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(group.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : null
    };
  });

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(g =>
      g.name.toLowerCase().includes(query) ||
      g.description?.toLowerCase().includes(query) ||
      g.subject.toLowerCase().includes(query) ||
      g.city.toLowerCase().includes(query)
    );
  }

  // Sort: groups user is member of first, then by creation date
  result.sort((a, b) => {
    if (a.isMember !== b.isMember) return a.isMember ? -1 : 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return result;
});

function openChat(group) {
  emit('open-chat', group);
}

function createGroup() {
  // TODO: Implement group creation modal
  console.log('Create group clicked');
}

onMounted(async () => {
  await loadStudyGroups();
  await loadGroupMembers();
});
</script>

<template>
  <div class="groups-page">
    <!-- Header -->
    <header class="groups-header">
      <h1>Groupes</h1>
      <button class="create-btn" @click="createGroup">
        <q-icon name="add" />
      </button>
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
        v-for="group in groups"
        :key="group.id"
        class="group-item"
        @click="openChat(group)"
      >
        <div class="group-avatar">
          <q-icon name="groups" size="24px" />
        </div>

        <div class="group-content">
          <div class="group-header">
            <span class="group-name">{{ group.name }}</span>
            <span class="group-time">{{ group.time }}</span>
          </div>

          <div class="group-info">
            <span class="group-subject">{{ group.subject }}</span>
            <span class="group-location">
              <q-icon name="location_on" size="14px" />
              {{ group.city }}
            </span>
            <span class="group-members">
              <q-icon name="people" size="14px" />
              {{ group.memberCount }}/{{ group.maxMembers || '∞' }}
            </span>
          </div>

          <div class="group-preview">
            <span class="last-message" :class="{ placeholder: !group.hasMessages }">
              {{ group.lastMessage }}
            </span>
            <span v-if="group.unread > 0" class="unread-badge">
              {{ group.unread }}
            </span>
          </div>

          <!-- Session preview if exists -->
          <div v-if="group.hasSession" class="session-preview">
            <q-icon name="event" size="14px" />
            <span class="session-info">
              Session: {{ group.sessionDate }} à {{ group.sessionTime }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="groups.length === 0 && !searchQuery" class="no-groups">
        <q-icon name="groups" size="64px" color="grey-4" />
        <p>Aucun groupe</p>
        <span>Les groupes apparaîtront ici</span>
        <button class="create-first-btn" @click="createGroup">
          Créer le premier groupe
        </button>
      </div>

      <!-- No search results -->
      <div v-if="groups.length === 0 && searchQuery" class="no-groups">
        <q-icon name="search_off" size="64px" color="grey-4" />
        <p>Aucun résultat</p>
        <span>Aucun groupe ne correspond à "{{ searchQuery }}"</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.groups-page {
  background: white;
  min-height: 100vh;
  padding-bottom: 80px;
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
}

.groups-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--sc-text-primary);
  margin: 0;
}

.create-btn {
  background: var(--sc-primary);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
}

.create-btn .q-icon {
  font-size: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  margin: 0 16px 12px;
  padding: 10px 16px;
  background: #F5F5F5;
  border-radius: 12px;
}

.search-icon {
  color: var(--sc-text-secondary);
  margin-right: 8px;
}

.search-input {
  border: none;
  background: transparent;
  flex: 1;
  font-size: 16px;
  color: var(--sc-text-primary);
}

.search-input::placeholder {
  color: var(--sc-text-secondary);
}

.groups-list {
  padding: 0 16px;
}

.group-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid #E5E5E5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-item:hover {
  background: #F9F9F9;
}

.group-item:last-child {
  border-bottom: none;
}

.group-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--sc-primary-light);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: var(--sc-primary);
  flex-shrink: 0;
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
  color: var(--sc-text-primary);
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-time {
  font-size: 12px;
  color: var(--sc-text-secondary);
  flex-shrink: 0;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--sc-text-secondary);
}

.group-subject {
  background: #E3F2FD;
  color: #1976D2;
  padding: 2px 6px;
  border-radius: 4px;
}

.group-location,
.group-members {
  display: flex;
  align-items: center;
  gap: 2px;
}

.group-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  font-size: 14px;
  color: var(--sc-text-secondary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.last-message.placeholder {
  font-style: italic;
}

.unread-badge {
  background: var(--sc-primary);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

.session-preview {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 6px 8px;
  background: #FFF3E0;
  border-radius: 6px;
  font-size: 12px;
  color: #F57C00;
}

.session-info {
  font-weight: 500;
}

.no-groups {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--sc-text-secondary);
}

.no-groups .q-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-groups p {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: var(--sc-text-primary);
}

.no-groups span {
  font-size: 14px;
  margin-bottom: 20px;
}

.create-first-btn {
  background: var(--sc-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>