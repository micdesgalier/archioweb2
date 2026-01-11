<script setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { authToken, currentUserId } from '@/store/chat.js';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  group: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'join', 'open-chat', 'session-added']);

const $q = useQuasar();

const isMember = computed(() => props.group.isMember);

async function joinGroup() {
  try {
    console.log('🚀 Joining group:', props.group.id, props.group.name);
    const response = await fetch('/api/group-members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.value}`
      },
      body: JSON.stringify({
        group_id: props.group.id
      })
    });

    if (response.ok) {
      const memberData = await response.json();
      console.log('✅ Successfully joined group:', memberData);
      
      $q.notify({
        type: 'positive',
        message: 'Vous avez rejoint le groupe',
        position: 'top'
      });
      
      // If group has a session, add it to calendar
      console.log('🔍 Checking session data:', {
        hasSession: props.group.hasSession,
        rawGroup: props.group.rawGroup,
        start_time: props.group.rawGroup?.start_time,
        sessionTopic: props.group.sessionTopic,
        sessionTime: props.group.sessionTime,
        fullGroup: props.group
      });
      
      // Try multiple ways to get the session data
      const startTime = props.group.rawGroup?.start_time || props.group.start_time;
      const hasSession = props.group.hasSession || (startTime && (props.group.rawGroup?.end_time || props.group.end_time));
      
      if (hasSession && startTime) {
        const formattedDate = formatDateForCalendar(startTime);
        console.log('📅 Formatted date:', formattedDate, 'from:', startTime);
        if (formattedDate) {
          const session = {
            title: props.group.name,
            subject: props.group.sessionTopic || props.group.subject || 'Session',
            date: formattedDate,
            timeRange: props.group.sessionTime || '14:00 - 16:00'
          };
          console.log('📅 Emitting session-added event:', session);
          emit('session-added', session);
        } else {
          console.warn('⚠️ Could not format date for calendar:', startTime);
        }
      } else {
        console.warn('⚠️ Group does not have session data:', {
          hasSession: props.group.hasSession,
          hasRawGroup: !!props.group.rawGroup,
          hasStartTime: !!startTime,
          startTime: startTime
        });
      }
      
      emit('join');
      emit('close');
    } else {
      const error = await response.json();
      console.error('❌ Error joining group:', error);
      throw new Error(error.error || 'Erreur lors de l\'adhésion');
    }
  } catch (err) {
    console.error('Error joining group:', err);
    $q.notify({
      type: 'negative',
      message: err.message || 'Erreur lors de l\'adhésion au groupe',
      position: 'top'
    });
  }
}

function formatDateForCalendar(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateStr);
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  } catch (err) {
    console.error('Error formatting date:', err, dateStr);
    return '';
  }
}

function openChat() {
  emit('open-chat', {
    ...props.group,
    type: 'group',
    name: props.group.name,
    fullName: props.group.name
  });
  emit('close');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const dayName = days[date.getDay()];
  return `${dayName} ${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
}
</script>

<template>
  <q-dialog :model-value="show" @hide="emit('close')">
    <q-card class="group-detail-card">
      <q-card-section class="card-header">
        <div class="header-content">
          <div class="group-avatar-large" :style="{ backgroundColor: group.avatarImage ? 'transparent' : group.avatarColor }">
            <img 
              v-if="group.avatarImage" 
              :src="group.avatarImage" 
              :alt="group.name" 
              class="group-avatar-img-large"
            />
            <div v-else class="avatar-faces">
              <div v-for="(member, idx) in group.avatarMembers.slice(0, 3)" :key="idx" class="avatar-face">
                <q-icon name="person" size="20px" />
              </div>
            </div>
          </div>
          <div class="group-info-header">
            <h2>{{ group.name }}</h2>
            <div class="group-meta-info">
              <div class="meta-item">
                <q-icon name="people" size="16px" />
                <span>{{ group.memberCount }} Membres</span>
              </div>
              <div class="meta-item" v-if="group.locationDetail || group.city">
                <q-icon name="place" size="16px" color="red" />
                <span>{{ group.locationDetail || group.city }}</span>
              </div>
            </div>
          </div>
          <q-btn flat round icon="close" @click="emit('close')" class="close-btn" />
        </div>
      </q-card-section>

      <q-card-section class="card-body" v-if="group.hasSession">
        <h3 class="section-title">Prochaine session</h3>
        <div class="session-info">
          <div class="session-item">
            <span class="session-label">Matière:</span>
            <span class="session-value">{{ group.sessionTopic }}</span>
          </div>
          <div class="session-item" v-if="group.locationDetail">
            <q-icon name="place" size="16px" color="red" />
            <span class="session-value">{{ group.locationDetail }}</span>
          </div>
          <div class="session-item">
            <span class="session-label">Date:</span>
            <span class="session-value">{{ formatDate(group.rawGroup?.start_time) || group.sessionDate }}</span>
          </div>
          <div class="session-item">
            <span class="session-label">Heure:</span>
            <span class="session-value">{{ group.sessionTime }}</span>
          </div>
        </div>
      </q-card-section>

      <q-card-actions class="card-actions">
        <q-btn
          v-if="!isMember"
          color="primary"
          label="Rejoindre"
          class="action-btn"
          @click="joinGroup"
        />
        <q-btn
          v-else
          color="primary"
          outline
          label="Ajouter des gens"
          class="action-btn"
          @click="joinGroup"
        />
        <q-btn
          color="secondary"
          label="Chat du groupe"
          class="action-btn"
          @click="openChat"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.group-detail-card {
  width: 90%;
  max-width: 400px;
  border-radius: 20px;
  background: linear-gradient(135deg, #4A90D9 0%, #3B7DC9 100%);
  color: white;
}

.card-header {
  padding: 24px;
  padding-bottom: 20px;
}

.header-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
}

.group-avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding: 6px;
}

.avatar-face {
  width: 22px;
  height: 22px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.group-avatar-img-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.group-info-header {
  flex: 1;
  min-width: 0;
}

.group-info-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.group-meta-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.close-btn {
  position: absolute;
  top: 0;
  right: 0;
  color: white;
}

.card-body {
  padding: 20px 24px;
  background: white;
  color: #1a1a1a;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.session-label {
  font-weight: 600;
  color: #666;
  min-width: 60px;
}

.session-value {
  color: #1a1a1a;
  background: #F5F5F5;
  padding: 6px 12px;
  border-radius: 16px;
  font-weight: 500;
}

.card-actions {
  padding: 16px 24px;
  background: white;
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  border-radius: 12px;
  font-weight: 600;
}
</style>