<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { allUsers, loadAllUsers, currentUserId, currentUsername, sendPrivateMessage } from '@/store/chat.js';

const $q = useQuasar();
const emit = defineEmits(['open-chat', 'open-chat-with-message']);

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
  needsHelpSubjects: [] // Multiple subjects allowed
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
         filters.value.needsHelpSubjects.length > 0;
});

// Filter users (excluding current user)
const filteredUsers = computed(() => {
  return allUsers.value
    .filter(user => user._id !== currentUserId.value)
    .filter(user => {
      // City filter
      if (filters.value.city && user.city_id?.name !== filters.value.city) {
        return false;
      }
      
      // Can help subjects filter - find users who can help in ANY of these subjects
      if (filters.value.canHelpSubjects.length > 0) {
        const hasAnySubject = filters.value.canHelpSubjects.some(filterSubject =>
          user.subjects?.some(s => s.subject === filterSubject && s.canHelp)
        );
        if (!hasAnySubject) return false;
      }
      
      // Needs help subjects filter - find users who need help in ANY of these subjects
      if (filters.value.needsHelpSubjects.length > 0) {
        const hasAnySubject = filters.value.needsHelpSubjects.some(filterSubject =>
          user.subjects?.some(s => s.subject === filterSubject && s.needsHelp)
        );
        if (!hasAnySubject) return false;
      }
      
      return true;
    });
});

// Current displayed user
const currentUser = computed(() => {
  if (currentIndex.value >= filteredUsers.value.length) {
    return null;
  }
  return filteredUsers.value[currentIndex.value];
});

// Get subjects the user can help with
const canHelpSubjects = computed(() => {
  if (!currentUser.value?.subjects) return [];
  return currentUser.value.subjects.filter(s => s.canHelp);
});

// Get subjects the user needs help with
const needsHelpSubjects = computed(() => {
  if (!currentUser.value?.subjects) return [];
  return currentUser.value.subjects.filter(s => s.needsHelp);
});

// Actions
function skipUser() {
  if (filteredUsers.value.length <= 1) {
    return; // No other users to show
  }
  
  // Move to next user, cycle back to start if at end
  currentIndex.value = (currentIndex.value + 1) % filteredUsers.value.length;
}

function openChat() {
  if (currentUser.value) {
    emit('open-chat', {
      id: currentUser.value._id,
      name: `${currentUser.value.first_name} ${currentUser.value.last_name}`,
      partnerName: currentUser.value.first_name,
      avatar: currentUser.value.avatar_url || `https://i.pravatar.cc/100?u=${currentUser.value._id}`
    });
  }
}

function proposeSession() {
  if (!currentUser.value) return;
  showProposalModal.value = true;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('/');
  return `${day}.${month}.${year}`;
}

async function sendSessionProposal() {
  if (!currentUser.value || !sessionSubject.value || !sessionDate.value || !sessionTimeStart.value || !sessionTimeEnd.value) {
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
    title: currentUser.value.first_name,
    subject: sessionSubject.value,
    date: sessionDate.value,
    dateFormatted: formatDate(sessionDate.value),
    timeRange: `${sessionTimeStart.value} - ${sessionTimeEnd.value}`,
    status: 'pending'
  };
  
  // Send as a special formatted message
  const messageContent = `[SESSION_PROPOSAL]${JSON.stringify(sessionMessage)}`;
  
  try {
    await sendPrivateMessage(currentUser.value.first_name, messageContent);
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
    
    // Open chat with this user
    emit('open-chat', {
      id: currentUser.value._id,
      name: `${currentUser.value.first_name} ${currentUser.value.last_name}`,
      partnerName: currentUser.value.first_name,
      avatar: currentUser.value.avatar_url || `https://i.pravatar.cc/100?u=${currentUser.value._id}`
    });
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
    <div v-if="currentUser" class="card-container">
      <div class="user-card">
        <!-- Avatar -->
        <div class="avatar-container">
          <img 
            :src="currentUser.avatar_url || `https://i.pravatar.cc/200?u=${currentUser._id}`" 
            :alt="currentUser.first_name"
            class="user-avatar"
          />
        </div>
        
        <!-- Name -->
        <h2 class="user-name">{{ currentUser.first_name }} {{ currentUser.last_name }}</h2>
        
        <!-- Info Card -->
        <div class="info-card">
          <!-- Institution -->
          <div class="info-section">
            <span class="info-label">Établissement et études</span>
            <div class="info-tags">
              <span class="tag white">{{ currentUser.institution_id?.name || 'Non renseigné' }}</span>
              <span v-if="currentUser.field_id?.name" class="tag white">{{ currentUser.field_id.name }}</span>
              <span v-if="currentUser.study_year" class="tag white">{{ currentUser.study_year }}ème</span>
            </div>
          </div>
          
          <!-- City -->
          <div class="info-section">
            <span class="info-label">Réside à</span>
            <div class="info-tags">
              <span class="tag white">{{ currentUser.city_id?.name || 'Non renseigné' }}</span>
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
        <button class="action-btn session" @click="proposeSession">
          Proposer une session
        </button>
      </div>
    </div>

    <!-- No more users -->
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
  border-radius: 32px;
  overflow: hidden;
  background: #FCD34D;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.user-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

