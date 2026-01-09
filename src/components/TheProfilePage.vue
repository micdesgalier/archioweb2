<script setup>
import { ref, computed, onMounted } from 'vue';
import { currentUserId, authToken, logout } from '@/store/chat.js';

const emit = defineEmits(['logout']);

const isEditing = ref(false);
const profileData = ref(null);
const loading = ref(true);
const loadingProfile = ref(false);

// Données éditables
const editedFirstName = ref('');
const editedLastName = ref('');
const editedStudyYear = ref('');
const editedFieldName = ref('');

// Charger les données du profil
async function loadProfile() {
  loadingProfile.value = true;
  try {
    const response = await fetch('/api/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken.value}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement du profil');
    }
    
    const userData = await response.json();
    profileData.value = userData;
    editedFirstName.value = userData.first_name || '';
    editedLastName.value = userData.last_name || '';
    editedStudyYear.value = userData.study_year || '';
    editedFieldName.value = userData.field_id?.name || '';
  } catch (err) {
    console.error('Error loading profile:', err);
  } finally {
    loadingProfile.value = false;
    loading.value = false;
  }
}

onMounted(() => {
  loadProfile();
});

// Formater les matières pour l'affichage
const subjects = computed(() => {
  if (!profileData.value?.subjects) return [];
  return profileData.value.subjects.map(subj => ({
    name: subj.subject,
    color: subj.canHelp ? '#22C55E' : subj.needsHelp ? '#FBBF24' : '#6B7280'
  }));
});

// Formater les disponibilités
const availabilities = computed(() => {
  if (!profileData.value?.availabilities || profileData.value.availabilities.length === 0) {
    return [];
  }
  return profileData.value.availabilities.map(avail => {
    const date = new Date(avail.start_time);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  });
});

// Photo de profil
const profilePicture = computed(() => {
  return profileData.value?.avatar_url || `https://i.pravatar.cc/150?u=${currentUserId.value || 'default'}`;
});

// Texte des études
const studiesText = computed(() => {
  if (!profileData.value) return '';
  const year = profileData.value.study_year;
  const field = profileData.value.field_id?.name || '';
  if (year && field) {
    const yearText = year === 1 ? '1ère année' : `${year}ème année`;
    return `${yearText} de ${field}`;
  }
  return field || 'Non spécifié';
});

// Activer le mode édition
function enableEdit() {
  isEditing.value = true;
}

// Sauvegarder les modifications
async function saveProfile() {
  // TODO: Implémenter l'API de mise à jour du profil
  // Pour l'instant, on simule juste la sauvegarde
  if (profileData.value) {
    profileData.value.first_name = editedFirstName.value;
    profileData.value.last_name = editedLastName.value;
    profileData.value.study_year = parseInt(editedStudyYear.value);
    if (profileData.value.field_id) {
      profileData.value.field_id.name = editedFieldName.value;
    }
  }
  isEditing.value = false;
}

// Annuler l'édition
function cancelEdit() {
  editedFirstName.value = profileData.value?.first_name || '';
  editedLastName.value = profileData.value?.last_name || '';
  editedStudyYear.value = profileData.value?.study_year || '';
  editedFieldName.value = profileData.value?.field_id?.name || '';
  isEditing.value = false;
}

// Gérer la déconnexion
async function handleLogout() {
  await logout();
  emit('logout');
}
</script>

<template>
  <div class="profile-page">
    <!-- Loading state -->
    <div v-if="loading || loadingProfile" class="loading-state">
      <q-icon name="hourglass_empty" size="48px" color="grey-5" />
      <p>Chargement...</p>
    </div>

    <template v-else>
      <!-- Header avec titre -->
      <header class="profile-header">
        <h1 class="profile-title">Mon profil</h1>
      </header>

      <!-- Carte principale avec gradient -->
      <div class="profile-card">
      <!-- Photo de profil -->
      <div class="profile-picture-container">
        <img :src="profilePicture" alt="Photo de profil" class="profile-picture" />
      </div>

      <!-- Section Informations -->
      <div class="info-section">
        <h2 class="section-title">Informations</h2>
        
        <div class="info-item">
          <span class="info-label">Nom</span>
          <div class="info-value-container">
            <input 
              v-if="isEditing" 
              v-model="editedLastName" 
              class="info-input"
              placeholder="Nom"
            />
            <span v-else class="info-value">{{ profileData?.last_name || 'Non spécifié' }}</span>
            <button v-if="isEditing" class="edit-icon-btn" @click="saveProfile" title="Sauvegarder">
              <q-icon name="check" size="18px" />
            </button>
            <button v-else class="edit-icon-btn" @click="enableEdit" title="Modifier">
              <q-icon name="edit" size="18px" />
            </button>
          </div>
        </div>

        <div class="info-item">
          <span class="info-label">Prénom</span>
          <div class="info-value-container">
            <input 
              v-if="isEditing" 
              v-model="editedFirstName" 
              class="info-input"
              placeholder="Prénom"
            />
            <span v-else class="info-value">{{ profileData?.first_name || 'Non spécifié' }}</span>
            <button v-if="isEditing" class="edit-icon-btn" @click="saveProfile" title="Sauvegarder">
              <q-icon name="check" size="18px" />
            </button>
            <button v-else class="edit-icon-btn" @click="enableEdit" title="Modifier">
              <q-icon name="edit" size="18px" />
            </button>
          </div>
        </div>

        <div class="info-item">
          <span class="info-label">Études</span>
          <div class="info-value-container">
            <input 
              v-if="isEditing" 
              v-model="editedFieldName" 
              class="info-input"
              placeholder="Filière"
            />
            <span v-else class="info-value">{{ studiesText }}</span>
            <button v-if="isEditing" class="edit-icon-btn" @click="saveProfile" title="Sauvegarder">
              <q-icon name="check" size="18px" />
            </button>
            <button v-else class="edit-icon-btn" @click="enableEdit" title="Modifier">
              <q-icon name="edit" size="18px" />
            </button>
          </div>
        </div>
      </div>

      <!-- Section Matières -->
      <div class="info-section">
        <h2 class="section-title">Matières</h2>
        <div class="subjects-container">
          <span 
            v-for="(subject, index) in subjects" 
            :key="index"
            class="subject-tag"
            :style="{ backgroundColor: subject.color }"
          >
            {{ subject.name }}
          </span>
          <span v-if="subjects.length === 0" class="no-subjects">Aucune matière</span>
        </div>
      </div>

      <!-- Section Disponibilités -->
      <div class="info-section">
        <h2 class="section-title">Disponibilités</h2>
        <div class="availabilities-container">
          <span 
            v-for="(availability, index) in availabilities" 
            :key="index"
            class="availability-item"
          >
            {{ availability }}
          </span>
          <span v-if="availabilities.length === 0" class="no-availabilities">Aucune disponibilité</span>
        </div>
      </div>
    </div>

    <!-- Boutons d'action -->
    <div class="action-buttons">
      <button v-if="!isEditing" class="edit-profile-btn" @click="enableEdit">
        Modifier le profil
      </button>
      <button v-else class="edit-profile-btn" @click="saveProfile">
        Sauvegarder
      </button>
      <button v-if="isEditing" class="cancel-btn" @click="cancelEdit">
        Annuler
      </button>
      <button v-if="!isEditing" class="logout-btn" @click="handleLogout">
        Déconnexion
      </button>
    </div>
    </template>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: white;
  padding-bottom: 100px;
}

.profile-header {
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #F0F0F0;
}

.profile-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--sc-text-primary);
  margin: 0;
  text-align: center;
}

/* Carte principale avec gradient */
.profile-card {
  margin: 20px;
  padding: 24px 20px;
  border-radius: 20px;
  background: #0066FF;
  color: white;
  position: relative;
}

.profile-picture-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.profile-picture {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.2);
}

/* Sections */
.info-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0 0 16px 0;
}

/* Items d'information */
.info-item {
  margin-bottom: 16px;
}

.info-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 6px;
}

.info-value-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: white;
  flex: 1;
}

.info-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 16px;
  font-weight: 600;
  font-family: var(--sc-font-family);
}

.info-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.info-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.3);
}

.edit-icon-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: background 0.2s;
}

.edit-icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Matières */
.subjects-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.subject-tag {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  color: white;
}

.no-subjects {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-style: italic;
}

/* Disponibilités */
.availabilities-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.availability-item {
  font-size: 14px;
  color: white;
  font-weight: 500;
}

.no-availabilities {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-style: italic;
}

/* Boutons d'action */
.action-buttons {
  display: flex;
  gap: 12px;
  padding: 0 20px;
  margin-top: 24px;
}

.edit-profile-btn,
.logout-btn,
.cancel-btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  font-family: var(--sc-font-family);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  color: white;
}

.edit-profile-btn {
  background: linear-gradient(135deg, #0046FB 0%, #0035C0 100%);
}

.logout-btn {
  background: linear-gradient(135deg, #0066FF 0%, #0046FB 100%);
}

.cancel-btn {
  background: linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%);
}

.edit-profile-btn:hover,
.logout-btn:hover,
.cancel-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 70, 251, 0.3);
}

.edit-profile-btn:active,
.logout-btn:active,
.cancel-btn:active {
  transform: translateY(0);
}

/* Loading state */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: var(--sc-text-secondary);
}

.loading-state p {
  margin-top: 16px;
  font-size: 14px;
}

/* Desktop Responsive */
@media (min-width: 768px) {
  .profile-page {
    max-width: 600px;
    margin: 0 auto;
    border-left: 1px solid #E8E8E8;
    border-right: 1px solid #E8E8E8;
  }
}

@media (min-width: 1024px) {
  .profile-page {
    max-width: 700px;
  }
}
</style>