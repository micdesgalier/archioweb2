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
const editedSubjects = ref([]);
const editedAvailabilities = ref([]);
const newSubjectName = ref('');

// Charger les données du profil
async function loadProfile() {
  loadingProfile.value = true;
  try {
    // Essayer de charger depuis l'API si elle existe
    const response = await fetch('/api/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken.value}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const userData = await response.json();
      profileData.value = userData;
      editedFirstName.value = userData.first_name || '';
      editedLastName.value = userData.last_name || '';
      editedStudyYear.value = userData.study_year || '';
      editedFieldName.value = userData.field_id?.name || '';
    } else {
      // Si l'API n'existe pas, utiliser les données par défaut
      profileData.value = {
        first_name: 'Alice',
        last_name: 'Dupont',
        study_year: 2,
        field_id: { name: 'Informatique' },
        avatar_url: 'https://i.pravatar.cc/150?img=1'
      };
      editedFirstName.value = 'Alice';
      editedLastName.value = 'Dupont';
      editedStudyYear.value = 2;
      editedFieldName.value = 'Informatique';
    }
  } catch (err) {
    console.error('Error loading profile:', err);
    // En cas d'erreur, utiliser les données par défaut
    profileData.value = {
      first_name: 'Alice',
      last_name: 'Dupont',
      study_year: 2,
      field_id: { name: 'Informatique' },
      avatar_url: 'https://i.pravatar.cc/150?img=1'
    };
    editedFirstName.value = 'Alice';
    editedLastName.value = 'Dupont';
    editedStudyYear.value = 2;
    editedFieldName.value = 'Informatique';
  } finally {
    loadingProfile.value = false;
    loading.value = false;
  }
}

onMounted(() => {
  loadProfile();
});

// Matières informatiques par défaut pour un étudiant en informatique
const defaultSubjects = [
  { name: 'Programmation', canHelp: true, needsHelp: false },
  { name: 'Base de données', canHelp: true, needsHelp: false },
  { name: 'Algorithmes', canHelp: false, needsHelp: true },
  { name: 'Réseaux', canHelp: false, needsHelp: true },
  { name: 'Sécurité', canHelp: true, needsHelp: false },
  { name: 'Web Development', canHelp: true, needsHelp: false }
];

// Formater les matières pour l'affichage (mode lecture)
const subjects = computed(() => {
  if (isEditing.value) {
    return [];
  }
  // Si on a des données du serveur, les utiliser
  if (profileData.value?.subjects && profileData.value.subjects.length > 0) {
    return profileData.value.subjects
      .filter(subj => subj.canHelp || subj.needsHelp) // Filtrer seulement celles avec un statut
      .map(subj => ({
        name: subj.subject || subj.name,
        color: subj.canHelp ? '#22C55E' : subj.needsHelp ? '#FBBF24' : '#6B7280'
      }));
  }
  // Sinon, utiliser les matières par défaut pour un étudiant en informatique
  return defaultSubjects
    .filter(subj => subj.canHelp || subj.needsHelp)
    .map(subj => ({
      name: subj.name,
      color: subj.canHelp ? '#22C55E' : subj.needsHelp ? '#FBBF24' : '#6B7280'
    }));
});

// Formater les disponibilités pour l'affichage (mode lecture)
const availabilities = computed(() => {
  if (isEditing.value) {
    // En mode édition, on retourne un tableau vide car on utilise editedAvailabilities directement
    return [];
  }
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
  return profileData.value?.avatar_url || 'https://i.pravatar.cc/150?img=1';
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
  // Initialiser les données éditables
  if (profileData.value?.subjects && profileData.value.subjects.length > 0) {
    editedSubjects.value = profileData.value.subjects.map(subj => ({
      name: subj.subject || subj.name,
      canHelp: subj.canHelp || false,
      needsHelp: subj.needsHelp || false
    }));
  } else {
    editedSubjects.value = [...defaultSubjects];
  }
  
  // Initialiser les disponibilités
  if (profileData.value?.availabilities && profileData.value.availabilities.length > 0) {
    editedAvailabilities.value = profileData.value.availabilities.map(avail => {
      const date = new Date(avail.start_time);
      return date.toISOString().split('T')[0];
    });
  } else {
    editedAvailabilities.value = [];
  }
  
  isEditing.value = true;
}

// Ajouter une nouvelle matière
function addSubject() {
  if (newSubjectName.value.trim()) {
    editedSubjects.value.push({
      name: newSubjectName.value.trim(),
      canHelp: false,
      needsHelp: false
    });
    newSubjectName.value = '';
  }
}

// Supprimer une matière
function removeSubject(index) {
  editedSubjects.value.splice(index, 1);
}

// Toggle canHelp pour une matière
function toggleCanHelp(index) {
  const subject = editedSubjects.value[index];
  subject.canHelp = !subject.canHelp;
  if (subject.canHelp) {
    subject.needsHelp = false;
  }
}

// Toggle needsHelp pour une matière
function toggleNeedsHelp(index) {
  const subject = editedSubjects.value[index];
  subject.needsHelp = !subject.needsHelp;
  if (subject.needsHelp) {
    subject.canHelp = false;
  }
}

// Ajouter une disponibilité
function addAvailability() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  editedAvailabilities.value.push(dateStr);
}

// Supprimer une disponibilité
function removeAvailability(index) {
  editedAvailabilities.value.splice(index, 1);
}

async function saveProfile() {
  if (!profileData.value) return;

  try {
    loadingProfile.value = true;

    const payload = {
      first_name: editedFirstName.value,
      last_name: editedLastName.value,
      study_year: Number(editedStudyYear.value) || null,
      // ⚠️ ici on envoie l'id du field, PAS le nom
      // à adapter si tu veux gérer la création/lookup du field
      // field_id: profileData.value.field_id?.id
    };

    const response = await fetch(`/api/users/${currentUserId.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.value}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erreur lors de la mise à jour');
    }

    const updatedUser = await response.json();

    // 🔁 Mettre à jour le state local avec la réponse API
    profileData.value = updatedUser;

    // 🔄 Réinitialiser les champs éditables
    editedFirstName.value = updatedUser.first_name || '';
    editedLastName.value = updatedUser.last_name || '';
    editedStudyYear.value = updatedUser.study_year || '';
    editedFieldName.value = updatedUser.field_id?.name || '';

    isEditing.value = false;
  } catch (err) {
    console.error('Erreur sauvegarde profil:', err);
    alert('Impossible de sauvegarder le profil');
  } finally {
    loadingProfile.value = false;
  }
}

// Annuler l'édition
function cancelEdit() {
  editedFirstName.value = profileData.value?.first_name || '';
  editedLastName.value = profileData.value?.last_name || '';
  editedStudyYear.value = profileData.value?.study_year || '';
  editedFieldName.value = profileData.value?.field_id?.name || '';
  editedSubjects.value = [];
  editedAvailabilities.value = [];
  newSubjectName.value = '';
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
          <template v-if="isEditing">
            <!-- Mode édition : afficher les matières avec options -->
            <div 
              v-for="(subject, index) in editedSubjects" 
              :key="index"
              class="subject-edit-item"
            >
              <span class="subject-name-edit">{{ subject.name }}</span>
              <div class="subject-actions">
                <button 
                  class="subject-help-btn subject-help-btn-green" 
                  :class="{ active: subject.canHelp }"
                  @click="toggleCanHelp(index)"
                  title="Peut aider"
                >
                  <q-icon name="arrow_upward" size="18px" />
                </button>
                <button 
                  class="subject-help-btn subject-help-btn-yellow" 
                  :class="{ active: subject.needsHelp }"
                  @click="toggleNeedsHelp(index)"
                  title="A besoin d'aide"
                >
                  <q-icon name="arrow_downward" size="18px" />
                </button>
                <button 
                  class="subject-remove-btn" 
                  @click="removeSubject(index)"
                  title="Supprimer"
                >
                  <q-icon name="close" size="18px" />
                </button>
              </div>
            </div>
            <!-- Champ pour ajouter une nouvelle matière -->
            <div class="add-subject-container">
              <input 
                v-model="newSubjectName"
                class="new-subject-input"
                placeholder="Nouvelle matière"
                @keyup.enter="addSubject"
              />
              <button class="add-subject-btn" @click="addSubject" title="Ajouter">
                <q-icon name="add" size="20px" />
              </button>
            </div>
          </template>
          <template v-else>
            <!-- Mode lecture : afficher les tags colorés -->
            <span 
              v-for="(subject, index) in subjects" 
              :key="index"
              class="subject-tag"
              :style="{ backgroundColor: subject.color }"
            >
              {{ subject.name }}
            </span>
            <span v-if="subjects.length === 0" class="no-subjects">Aucune matière</span>
          </template>
        </div>
      </div>

      <!-- Section Disponibilités -->
      <div class="info-section">
        <h2 class="section-title">Disponibilités</h2>
        <div class="availabilities-container">
          <template v-if="isEditing">
            <!-- Mode édition : afficher les dates avec possibilité de supprimer -->
            <div 
              v-for="(availability, index) in editedAvailabilities" 
              :key="index"
              class="availability-edit-item"
            >
              <input 
                type="date" 
                v-model="editedAvailabilities[index]" 
                class="availability-input"
              />
              <button 
                class="availability-remove-btn" 
                @click="removeAvailability(index)"
                title="Supprimer"
              >
                <q-icon name="close" size="18px" />
              </button>
            </div>
            <button class="add-availability-btn" @click="addAvailability">
              <q-icon name="add" size="18px" />
              Ajouter une date
            </button>
          </template>
          <template v-else>
            <!-- Mode lecture : afficher les dates formatées -->
            <span 
              v-for="(availability, index) in availabilities" 
              :key="index"
              class="availability-item"
            >
              {{ availability }}
            </span>
            <span v-if="availabilities.length === 0" class="no-availabilities">Aucune disponibilité</span>
          </template>
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
  display: inline-block;
  white-space: nowrap;
}

.subject-edit-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  margin-bottom: 8px;
  gap: 8px;
}

.subject-name-edit {
  font-size: 14px;
  font-weight: 600;
  color: white;
  flex: 1;
}

.subject-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.subject-help-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.subject-help-btn-green {
  background: rgba(34, 197, 94, 0.3);
  border-color: rgba(34, 197, 94, 0.6);
}

.subject-help-btn-green:hover {
  background: rgba(34, 197, 94, 0.5);
  border-color: rgba(34, 197, 94, 0.8);
}

.subject-help-btn-green.active {
  background: #22C55E;
  border-color: #22C55E;
}

.subject-help-btn-yellow {
  background: rgba(251, 191, 36, 0.3);
  border-color: rgba(251, 191, 36, 0.6);
}

.subject-help-btn-yellow:hover {
  background: rgba(251, 191, 36, 0.5);
  border-color: rgba(251, 191, 36, 0.8);
}

.subject-help-btn-yellow.active {
  background: #FBBF24;
  border-color: #FBBF24;
}

.subject-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(255, 77, 77, 0.3);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.subject-remove-btn:hover {
  background: rgba(255, 77, 77, 0.5);
  border-color: rgba(255, 255, 255, 0.6);
}

.add-subject-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.new-subject-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  font-weight: 500;
  font-family: var(--sc-font-family);
}

.new-subject-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.new-subject-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.3);
}

.add-subject-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.add-subject-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
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

.availability-edit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.availability-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 14px;
  font-weight: 500;
  font-family: var(--sc-font-family);
}

.availability-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.3);
}

.availability-input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

.availability-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  background: rgba(255, 77, 77, 0.3);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.availability-remove-btn:hover {
  background: rgba(255, 77, 77, 0.5);
  border-color: rgba(255, 255, 255, 0.6);
}

.add-availability-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
}

.add-availability-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.7);
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