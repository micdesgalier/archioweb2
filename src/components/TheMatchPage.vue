<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { allUsers, loadAllUsers, currentUserId, currentUsername, sendPrivateMessage, studyGroups } from '@/store/chat.js';
import avatarAliceAnalyse from '@/assets/aliceanalyse.png';
import avatarBob from '@/assets/bob.png';
import avatarCaroline from '@/assets/caroline.png';
import avatarDavid from '@/assets/david.png';
import avatarEmilie from '@/assets/emilie.png';

const $q = useQuasar();
const emit = defineEmits(['open-chat', 'open-chat-with-message']);

// Helper function to get avatar URL based on user name
function getUserAvatarUrl(user) {
  const firstName = user.first_name?.toLowerCase();
  
  // Check for specific users first (prioritize local images)
  if (user.first_name === 'Alice' || user.email === 'alice.dupont@example.com') {
    return avatarAliceAnalyse;
  } else if (firstName === 'bob') {
    return avatarBob;
  } else if (firstName === 'caroline') {
    return avatarCaroline;
  } else if (firstName === 'david') {
    return avatarDavid;
  } else if (firstName === 'émilie' || firstName === 'emilie') {
    return avatarEmilie;
  }
  
  // For other users, use avatar_url if available, otherwise use default
  if (user.avatar_url) {
    return user.avatar_url;
  }
  
  return `https://i.pravatar.cc/200?u=${user._id || user.id}`;
}

// Session proposal form
const showProposalModal = ref(false);
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

// Current card index for swipe-style navigation
const currentIndex = ref(0);

// Filter states
const showFilters = ref(false);
const filters = ref({
  city: '',
  canHelpSubjects: [],  // Multiple subjects allowed
  needsHelpSubjects: [], // Multiple subjects allowed
  type: 'person' // 'person' or 'group'
});

// Get unique cities from users
const availableCities = computed(() => {
  const cities = new Set();
  allUsers.value.forEach(user => {
    if (user.city_id?.name) {
      cities.add(user.city_id.name);
    }
  });
  return Array.from(cities).sort();
});

// Get unique subjects
const availableSubjects = computed(() => {
  const subjects = new Set();
  allUsers.value.forEach(user => {
    if (user.subjects) {
      user.subjects.forEach(s => subjects.add(s.subject));
    }
  });
  return Array.from(subjects).sort();
});

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return filters.value.city || 
         filters.value.canHelpSubjects.length > 0 || 
         filters.value.needsHelpSubjects.length > 0 ||
         filters.value.type !== 'person';
});

// Combined items (users or groups based on filter)
const allItems = computed(() => {
  if (filters.value.type === 'group') {
    return studyGroups.value.map(group => ({
      ...group,
      type: 'group',
      displayName: group.title,
      avatar: null, // Groups don't have avatars yet
      subjects: group.subject_id ? [{ subject: group.subject_id.name, canHelp: true, needsHelp: false }] : [],
      city_id: group.city_id || { name: group.is_online ? 'En ligne' : 'Non spécifié' }
    }));
  } else {
    return allUsers.value.map(user => ({
      ...user,
      type: 'person',
      displayName: `${user.first_name} ${user.last_name}`
    }));
  }
});

// Filter items (users or groups)
const filteredItems = computed(() => {
  return allItems.value
    .filter(item => item._id !== currentUserId.value || item.type === 'group') // Exclude current user from persons, but include all groups
    .filter(item => {
      // City filter
      if (filters.value.city && item.city_id?.name !== filters.value.city) {
        return false;
      }
      
      // For groups, we only filter by city and subject
      if (item.type === 'group') {
        if (filters.value.canHelpSubjects.length > 0) {
          const hasAnySubject = filters.value.canHelpSubjects.some(filterSubject =>
            item.subjects?.some(s => s.subject === filterSubject)
          );
          if (!hasAnySubject) return false;
        }
        return true;
      }
      
      // Person filters
      // Can help subjects filter - find users who can help in ANY of these subjects
      if (filters.value.canHelpSubjects.length > 0) {
        const hasAnySubject = filters.value.canHelpSubjects.some(filterSubject =>
          item.subjects?.some(s => s.subject === filterSubject && s.canHelp)
        );
        if (!hasAnySubject) return false;
      }
      
      // Needs help subjects filter - find users who need help in ANY of these subjects
      if (filters.value.needsHelpSubjects.length > 0) {
        const hasAnySubject = filters.value.needsHelpSubjects.some(filterSubject =>
          item.subjects?.some(s => s.subject === filterSubject && s.needsHelp)
        );
        if (!hasAnySubject) return false;
      }
      
      return true;
    });
});

// Current displayed item
const currentItem = computed(() => {
  if (currentIndex.value >= filteredItems.value.length) {
    return null;
  }
  return filteredItems.value[currentIndex.value];
});

// Get subjects the user can help with
const canHelpSubjects = computed(() => {
  if (!currentItem.value?.subjects) return [];
  return currentItem.value.subjects.filter(s => s.canHelp);
});

// Get subjects the user needs help with
const needsHelpSubjects = computed(() => {
  if (!currentItem.value?.subjects) return [];
  return currentItem.value.subjects.filter(s => s.needsHelp);
});

// Actions
function skipUser() {
  if (filteredItems.value.length <= 1) {
    return; // No other items to show
  }
  
  // Move to next item, cycle back to start if at end
  currentIndex.value = (currentIndex.value + 1) % filteredItems.value.length;
}

function openChat() {
  if (currentItem.value) {
    if (currentItem.value.type === 'group') {
      emit('open-chat', {
        id: currentItem.value._id,
        name: currentItem.value.title,
        type: 'group',
        avatar: null
      });
    } else {
      emit('open-chat', {
        id: currentItem.value._id,
        name: `${currentItem.value.first_name} ${currentItem.value.last_name}`,
        partnerName: currentItem.value.first_name,
        avatar: getUserAvatarUrl(currentItem.value)
      });
    }
  }
}

function proposeSession() {
  if (!currentItem.value || currentItem.value.type === 'group') return;
  showProposalModal.value = true;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('/');
  return `${day}.${month}.${year}`;
}

async function sendSessionProposal() {
  if (!currentItem.value || !sessionSubject.value || !sessionDate.value || !sessionTimeStart.value || !sessionTimeEnd.value) {
    $q.notify({
      type: 'warning',
      message: 'Veuillez remplir tous les champs',
      timeout: 2000
    });
    return;
  }
  
  // Create a special session proposal message
  const sessionMessage = {
    type: 'session_proposal',
    title: currentItem.value.type === 'group' ? currentItem.value.title : currentItem.value.first_name,
    subject: sessionSubject.value,
    date: sessionDate.value,
    dateFormatted: formatDate(sessionDate.value),
    timeRange: `${sessionTimeStart.value} - ${sessionTimeEnd.value}`,
    status: 'pending'
  };
  
  // Send as a special formatted message
  const messageContent = `[SESSION_PROPOSAL]${JSON.stringify(sessionMessage)}`;
  
  try {
    if (currentItem.value.type === 'group') {
      // TODO: Implement group messaging
      console.log('Group session proposal:', sessionMessage);
    } else {
      await sendPrivateMessage(currentItem.value.first_name, messageContent);
    }
    
    showProposalModal.value = false;
    
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
    
    // Open chat with this item
    if (currentItem.value.type === 'group') {
      emit('open-chat', {
        id: currentItem.value._id,
        name: currentItem.value.title,
        type: 'group',
        avatar: null
      });
    } else {
      emit('open-chat', {
        id: currentItem.value._id,
        name: `${currentItem.value.first_name} ${currentItem.value.last_name}`,
        partnerName: currentItem.value.first_name,
        avatar: getUserAvatarUrl(currentItem.value)
      });
    }
  } catch (err) {
    console.error('Error sending session proposal:', err);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'envoi',
      timeout: 2000
    });
  }
}

function clearFilters() {
  filters.value = {
    city: '',
    canHelpSubjects: [],
    needsHelpSubjects: []
  };
  currentIndex.value = 0;
}

function removeFilter(type, value) {
  if (type === 'city') {
    filters.value.city = '';
  } else if (type === 'canHelp') {
    filters.value.canHelpSubjects = filters.value.canHelpSubjects.filter(s => s !== value);
  } else if (type === 'needsHelp') {
    filters.value.needsHelpSubjects = filters.value.needsHelpSubjects.filter(s => s !== value);
  }
  currentIndex.value = 0;
}

function applyFilters() {
  currentIndex.value = 0;
  showFilters.value = false;
}

onMounted(() => {
  loadAllUsers();
});
</script>

<template>
  <div class="match-page">
    <!-- Header -->
    <header class="match-header">
      <h1>Match</h1>
      <button class="filter-btn" @click="showFilters = !showFilters">
        <q-icon name="tune" />
        <span v-if="hasActiveFilters" class="filter-badge"></span>
      </button>
    </header>

    <!-- Active Filters Display -->
    <div v-if="hasActiveFilters" class="active-filters">
      <q-chip 
        v-if="filters.city"
        removable
        @remove="removeFilter('city')"
        color="primary"
        text-color="white"
        size="sm"
      >
        📍 {{ filters.city }}
      </q-chip>
      <q-chip 
        v-for="subject in filters.canHelpSubjects"
        :key="'canHelp-' + subject"
        removable
        @remove="removeFilter('canHelp', subject)"
        color="green-5"
        text-color="white"
        size="sm"
      >
        ✓ {{ subject }}
      </q-chip>
      <q-chip 
        v-for="subject in filters.needsHelpSubjects"
        :key="'needsHelp-' + subject"
        removable
        @remove="removeFilter('needsHelp', subject)"
        color="amber-6"
        text-color="white"
        size="sm"
      >
        ? {{ subject }}
      </q-chip>
    </div>

    <!-- Filters Panel -->
    <div v-if="showFilters" class="filters-panel">
      <div class="filter-group">
        <label>Type</label>
        <q-select
          v-model="filters.type"
          :options="[
            { label: 'Personnes', value: 'person' },
            { label: 'Groupes', value: 'group' }
          ]"
          dense
          outlined
          class="filter-select"
          emit-value
          map-options
        />
      </div>
      
      <div class="filter-group">
        <label>Ville</label>
        <q-select
          v-model="filters.city"
          :options="availableCities"
          clearable
          dense
          outlined
          placeholder="Toutes les villes"
          class="filter-select"
          emit-value
          map-options
        />
      </div>
      
      <div class="filter-group">
        <label>Peut m'aider en</label>
        <q-select
          v-model="filters.canHelpSubjects"
          :options="availableSubjects"
          multiple
          dense
          outlined
          placeholder="Sélectionner les matières"
          class="filter-select"
          use-chips
          emit-value
          map-options
        />
      </div>
      
      <div class="filter-group">
        <label>A besoin d'aide en</label>
        <q-select
          v-model="filters.needsHelpSubjects"
          :options="availableSubjects"
          multiple
          dense
          outlined
          placeholder="Sélectionner les matières"
          class="filter-select"
          use-chips
          emit-value
          map-options
        />
      </div>
      
      <div class="filter-actions">
        <button class="clear-btn" @click="clearFilters">Effacer</button>
        <button class="apply-btn" @click="applyFilters">Appliquer</button>
      </div>
    </div>

    <!-- User Card -->
    <div v-if="currentItem" class="card-container">
      <div class="user-card">
        <!-- Avatar -->
        <div class="avatar-container">
          <img 
            v-if="currentItem.type === 'person'"
            :src="getUserAvatarUrl(currentItem)" 
            :alt="currentItem.first_name"
            class="user-avatar"
          />
          <div v-else class="group-avatar">
            <q-icon name="groups" size="48px" color="primary" />
          </div>
        </div>
        
        <!-- Name -->
        <h2 class="user-name">{{ currentItem.displayName }}</h2>
        
        <!-- Info Card -->
        <div class="info-card">
          <!-- Institution (only for persons) -->
          <div v-if="currentItem.type === 'person'" class="info-section">
            <span class="info-label">Établissement et études</span>
            <div class="info-tags">
              <span class="tag white">{{ currentItem.institution_id?.name || 'Non renseigné' }}</span>
              <span v-if="currentItem.field_id?.name" class="tag white">{{ currentItem.field_id.name }}</span>
              <span v-if="currentItem.study_year" class="tag white">{{ currentItem.study_year }}ème</span>
            </div>
          </div>
          
          <!-- Group info (only for groups) -->
          <div v-if="currentItem.type === 'group'" class="info-section">
            <span class="info-label">Groupe d'étude</span>
            <div class="info-tags">
              <span class="tag white">{{ currentItem.subject_id?.name || 'Général' }}</span>
              <span class="tag white">{{ currentItem.memberCount || 0 }} membres</span>
              <span v-if="currentItem.is_online" class="tag white">En ligne</span>
            </div>
          </div>
          
          <!-- City -->
          <div class="info-section">
            <span class="info-label">Localisation</span>
            <div class="info-tags">
              <span class="tag white">{{ currentItem.city_id?.name || (currentItem.is_online ? 'En ligne' : 'Non spécifié') }}</span>
            </div>
          </div>
          
          <!-- Can Help -->
          <div v-if="canHelpSubjects.length > 0" class="info-section">
            <span class="info-label">Peut aider en</span>
            <div class="info-tags">
              <span 
                v-for="subject in canHelpSubjects" 
                :key="subject.subject"
                class="tag green"
              >
                {{ subject.subject }}
              </span>
            </div>
          </div>
          
          <!-- Needs Help -->
          <div v-if="needsHelpSubjects.length > 0" class="info-section">
            <span class="info-label">A besoin d'aide en</span>
            <div class="info-tags">
              <span 
                v-for="subject in needsHelpSubjects" 
                :key="subject.subject"
                class="tag yellow"
              >
                {{ subject.subject }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="action-btn skip" @click="skipUser">
          <q-icon name="close" size="28px" />
        </button>
        <button class="action-btn chat" @click="openChat">
          <q-icon name="chat_bubble_outline" size="24px" />
        </button>
        <button v-if="currentItem.type === 'person'" class="action-btn session" @click="proposeSession">
          Proposer une session
        </button>
      </div>
    </div>

    <!-- No more items -->
    <div v-else class="no-users">
      <q-icon name="people" size="64px" color="grey-5" />
      <p>Plus de profils à afficher</p>
      <span>Modifiez vos filtres ou revenez plus tard</span>
      <button v-if="hasActiveFilters" class="reset-btn" @click="clearFilters">
        Réinitialiser les filtres
      </button>
    </div>

    <!-- Session Proposal Dialog -->
    <q-dialog v-model="showProposalModal">
      <q-card style="min-width: 350px; border-radius: 16px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Proposer une session</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-mb-md q-pa-sm" style="background: #F0F7FF; border-radius: 8px; color: #4A90D9;">
            <q-icon name="person" size="20px" class="q-mr-sm" />
            À : <strong>{{ currentUser?.first_name }}</strong>
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
            @click="sendSessionProposal"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped>
.match-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #E8F4FD 0%, #F5F5F5 100%);
  padding-bottom: 100px;
}

.match-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: white;
}

.match-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--sc-text-primary);
  margin: 0;
}

.filter-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--sc-primary-blue);
}

.filter-btn .q-icon {
  font-size: 24px;
}

.filter-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background: #22C55E;
  border-radius: 50%;
}

/* Active Filters Display */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #E5E7EB;
}

.active-filters .q-chip {
  margin: 0;
}

/* Filters Panel */
.filters-panel {
  background: white;
  padding: 16px 24px 20px;
  border-bottom: 1px solid #E5E7EB;
}

.filter-group {
  margin-bottom: 16px;
}

.filter-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--sc-text-secondary);
  margin-bottom: 8px;
}

.filter-select {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.clear-btn, .apply-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.clear-btn {
  background: #F5F5F5;
  color: var(--sc-text-secondary);
}

.apply-btn {
  background: var(--sc-primary-blue);
  color: white;
}

/* Card Container */
.card-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-card {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-container {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  background: #FCD34D;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.15);
  object-position: center;
}

.user-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--sc-primary-blue);
  margin: 0 0 20px;
  text-align: center;
}

/* Info Card */
.info-card {
  width: 100%;
  background: linear-gradient(135deg, #4A90D9 0%, #6BA8E8 100%);
  border-radius: 20px;
  padding: 20px;
}

.info-section {
  margin-bottom: 16px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
}

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.tag.white {
  background: white;
  color: var(--sc-text-primary);
}

.tag.green {
  background: #22C55E;
  color: white;
}

.tag.yellow {
  background: #FBBF24;
  color: white;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  width: 100%;
  max-width: 400px;
}

.action-btn {
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
}

.action-btn.skip {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: white;
  color: var(--sc-primary-blue);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn.chat {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: white;
  color: var(--sc-primary-blue);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn.session {
  flex: 1;
  max-width: 200px;
  height: 56px;
  border-radius: 28px;
  background: linear-gradient(135deg, #4A90D9 0%, #6BA8E8 100%);
  color: white;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(74, 144, 217, 0.3);
}

/* No Users */
.no-users {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
}

.no-users p {
  font-size: 18px;
  font-weight: 600;
  color: var(--sc-text-primary);
  margin: 16px 0 8px;
}

.no-users span {
  color: var(--sc-text-secondary);
  font-size: 14px;
}

.reset-btn {
  margin-top: 24px;
  padding: 12px 24px;
  border-radius: 12px;
  background: var(--sc-primary-blue);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

/* Desktop Responsive */
@media (min-width: 768px) {
  .match-page {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .card-container {
    padding: 40px;
  }
  
  .avatar-container {
    width: 220px;
    height: 220px;
  }
}
</style>