<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['complete']);

// Current step (0-3)
const currentStep = ref(0);
const totalSteps = 4;

// Step 1: Objectif
const objectif = ref('');
const objectifOptions = [
  { value: 'reviser', label: 'Réviser ensemble' },
  { value: 'aider', label: 'Me faire aider' },
  { value: 'les_deux', label: 'Les deux' }
];

// Step 2: Matières
const matieres = ref([]);
const searchMatiere = ref('');
const matiereMode = ref('aider'); // 'aider' or 'me_faire_aider'
const availableMatieres = [
  'Programmation', 'Mathématiques', 'Allemand', 'DevMob', 
  'Géographie', 'Histoire', 'Physique', 'Chimie', 
  'Anglais', 'Français', 'Économie', 'Droit'
];
const filteredMatieres = computed(() => {
  if (!searchMatiere.value) return [];
  return availableMatieres.filter(m => 
    m.toLowerCase().includes(searchMatiere.value.toLowerCase()) &&
    !matieres.value.some(selected => selected.name === m)
  );
});

function addMatiere(name) {
  matieres.value.push({ name, mode: matiereMode.value });
  searchMatiere.value = '';
}

function removeMatiere(index) {
  matieres.value.splice(index, 1);
}

// Step 3: Disponibilités
const disponibilites = ref([
  { jour: 'Lundi', recurring: false, date: '', heureDebut: '14:00', heureFin: '16:30' }
]);
const joursOptions = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function addDisponibilite() {
  disponibilites.value.push({ jour: 'Lundi', recurring: false, date: '', heureDebut: '09:00', heureFin: '11:00' });
}

function removeDisponibilite(index) {
  disponibilites.value.splice(index, 1);
}

// Step 4: Infos études
const infosEtudes = ref({
  ville: '',
  institution: '',
  filiere: '',
  anneeEtude: ''
});

// Navigation
function nextStep() {
  if (currentStep.value < totalSteps - 1) {
    currentStep.value++;
  } else {
    completeOnboarding();
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function goToStep(index) {
  currentStep.value = index;
}

// Validation
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: return !!objectif.value;
    case 1: return matieres.value.length > 0;
    case 2: return disponibilites.value.length > 0;
    case 3: 
      // Tous les champs doivent être remplis pour la dernière slide
      return !!infosEtudes.value.ville && 
             !!infosEtudes.value.institution && 
             !!infosEtudes.value.filiere && 
             !!infosEtudes.value.anneeEtude;
    default: return true;
  }
});

// Complete onboarding
async function completeOnboarding() {
  const data = {
    objectif: objectif.value,
    matieres: matieres.value,
    disponibilites: disponibilites.value,
    infosEtudes: infosEtudes.value
  };
  
  // TODO: Save to backend
  console.log('Onboarding data:', data);
  
  emit('complete', data);
}
</script>

<template>
  <div class="onboarding-page">
    <!-- Step 1: Objectif -->
    <div v-if="currentStep === 0" class="onboarding-step">
      <h1 class="onboarding-title">Objectif</h1>
      
      <div class="objectif-options">
        <button
          v-for="option in objectifOptions"
          :key="option.value"
          class="objectif-btn"
          :class="{ active: objectif === option.value }"
          @click="objectif = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Step 2: Matières -->
    <div v-if="currentStep === 1" class="onboarding-step">
      <h1 class="onboarding-title">Matières</h1>
      
      <div class="matieres-card">
        <div class="matieres-tags">
          <span 
            v-for="(matiere, index) in matieres" 
            :key="index"
            class="matiere-tag"
            :class="matiere.mode"
          >
            {{ matiere.name }}
            <button class="tag-remove" @click="removeMatiere(index)">×</button>
          </span>
          <span v-if="matieres.length === 0" class="matieres-placeholder">
            Recherchez et ajoutez vos matières
          </span>
        </div>
      </div>

      <div class="search-container">
        <q-icon name="search" class="search-icon" />
        <input
          v-model="searchMatiere"
          type="text"
          class="search-input"
          placeholder="Rechercher une matière..."
        />
      </div>

      <div v-if="filteredMatieres.length > 0" class="search-results">
        <button 
          v-for="matiere in filteredMatieres" 
          :key="matiere"
          class="search-result-item"
          @click="addMatiere(matiere)"
        >
          {{ matiere }}
        </button>
      </div>

      <div class="mode-toggle">
        <button 
          class="mode-btn" 
          :class="{ active: matiereMode === 'aider' }"
          @click="matiereMode = 'aider'"
        >
          Aider
        </button>
        <button 
          class="mode-btn" 
          :class="{ active: matiereMode === 'me_faire_aider' }"
          @click="matiereMode = 'me_faire_aider'"
        >
          Me faire aider
        </button>
        <span class="mode-check">✓</span>
      </div>
    </div>

    <!-- Step 3: Disponibilités -->
    <div v-if="currentStep === 2" class="onboarding-step">
      <h1 class="onboarding-title">Disponibilités</h1>
      <p class="onboarding-subtitle">Mes prochaines disponibilités pour travailler :</p>
      
      <div class="disponibilites-container">
        <div 
          v-for="(dispo, index) in disponibilites" 
          :key="index"
          class="disponibilite-card"
        >
          <button 
            v-if="disponibilites.length > 1"
            class="dispo-remove" 
            @click="removeDisponibilite(index)"
          >×</button>
          
          <div class="dispo-field">
            <label>Jour de Semaine</label>
            <div class="dispo-row">
              <select v-model="dispo.jour" class="dispo-select">
                <option v-for="jour in joursOptions" :key="jour" :value="jour">
                  {{ jour }}
                </option>
              </select>
              <label class="recurring-toggle">
                <input type="checkbox" v-model="dispo.recurring" />
                <span>Tous les {{ dispo.jour.toLowerCase() }}s</span>
              </label>
            </div>
          </div>

          <div class="dispo-field">
            <label>Date</label>
            <input type="date" v-model="dispo.date" class="dispo-input" />
          </div>

          <div class="dispo-field">
            <label>Heure</label>
            <div class="dispo-row">
              <input type="time" v-model="dispo.heureDebut" class="dispo-input time" />
              <span>-</span>
              <input type="time" v-model="dispo.heureFin" class="dispo-input time" />
            </div>
          </div>
        </div>
      </div>

      <button class="add-dispo-btn" @click="addDisponibilite">
        <q-icon name="add" />
      </button>
    </div>

    <!-- Step 4: Infos études -->
    <div v-if="currentStep === 3" class="onboarding-step">
      <h1 class="onboarding-title">Infos études</h1>
      
      <div class="infos-form">
        <div class="form-field">
          <label>Ville</label>
          <input 
            v-model="infosEtudes.ville"
            type="text" 
            class="form-input"
            placeholder="Dans quelle ville étudiez-vous"
          />
        </div>

        <div class="form-field">
          <label>Institution</label>
          <input 
            v-model="infosEtudes.institution"
            type="text" 
            class="form-input"
            placeholder="Quel est votre établissement"
          />
        </div>

        <div class="form-field">
          <label>Filière</label>
          <input 
            v-model="infosEtudes.filiere"
            type="text" 
            class="form-input"
            placeholder="En quelle filière êtes-vous"
          />
        </div>

        <div class="form-field">
          <label>Année d'étude</label>
          <input 
            v-model="infosEtudes.anneeEtude"
            type="text" 
            class="form-input"
            placeholder="Quel est votre année d'étude actuelle"
          />
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <div class="onboarding-nav">
      <div class="dots">
        <span 
          v-for="i in totalSteps" 
          :key="i"
          class="dot"
          :class="{ active: currentStep === i - 1 }"
          @click="goToStep(i - 1)"
        ></span>
      </div>

      <button 
        class="nav-btn"
        :disabled="!canProceed"
        @click="nextStep"
      >
        {{ currentStep === totalSteps - 1 ? 'Valider' : 'Suivant' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.onboarding-page {
  width: 100%;
  min-height: 100vh;
  background: radial-gradient(ellipse at center top, #0066FF 0%, #0046FB 50%, #0035C0 100%);
  display: flex;
  flex-direction: column;
  padding: var(--sc-spacing-lg) var(--sc-spacing-md);
  color: var(--sc-text-white);
}

.onboarding-step {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.onboarding-title {
  font-size: 32px;
  font-weight: var(--sc-font-weight-bold);
  margin-bottom: var(--sc-spacing-md);
  margin-top: var(--sc-spacing-xl);
}

.onboarding-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: var(--sc-spacing-lg);
}

/* Step 1: Objectif */
.objectif-options {
  display: flex;
  flex-direction: column;
  gap: var(--sc-spacing-md);
  margin-top: auto;
  margin-bottom: auto;
}

.objectif-btn {
  padding: 18px 24px;
  border-radius: var(--sc-border-radius);
  font-size: 18px;
  font-weight: var(--sc-font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.9);
  color: var(--sc-primary-blue);
}

.objectif-btn.active {
  background: linear-gradient(135deg, #4DA3FF 0%, #0066FF 100%);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(0, 102, 255, 0.4);
}

/* Step 2: Matières */
.matieres-card {
  background: linear-gradient(135deg, #4DA3FF 0%, #0066FF 100%);
  border-radius: var(--sc-border-radius-lg);
  padding: var(--sc-spacing-md);
  min-height: 150px;
  margin-bottom: var(--sc-spacing-md);
}

.matieres-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.matiere-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: var(--sc-font-weight-medium);
}

.matiere-tag.aider {
  background: #4CAF50;
  color: white;
}

.matiere-tag.me_faire_aider {
  background: #FFC107;
  color: #333;
}

.tag-remove {
  background: none;
  border: none;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.matieres-placeholder {
  opacity: 0.7;
  font-size: 14px;
}

.search-container {
  position: relative;
  margin-bottom: var(--sc-spacing-sm);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--sc-text-secondary);
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 45px;
  border: none;
  border-radius: var(--sc-border-radius-sm);
  background: white;
  font-size: 16px;
  color: var(--sc-text-primary);
}

.search-results {
  background: white;
  border-radius: var(--sc-border-radius-sm);
  margin-bottom: var(--sc-spacing-sm);
  max-height: 150px;
  overflow-y: auto;
}

.search-result-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  color: var(--sc-text-primary);
  font-size: 14px;
}

.search-result-item:hover {
  background: var(--sc-bg-light-gray);
}

.mode-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px;
  border-radius: 25px;
  width: fit-content;
}

.mode-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: white;
}

.mode-btn.active {
  background: #4CAF50;
  color: white;
}

.mode-btn.active:last-of-type {
  background: #FFC107;
  color: #333;
}

.mode-check {
  background: white;
  color: var(--sc-primary-blue);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* Step 3: Disponibilités */
.disponibilites-container {
  display: flex;
  gap: var(--sc-spacing-md);
  overflow-x: auto;
  padding-bottom: var(--sc-spacing-sm);
  margin-bottom: var(--sc-spacing-md);
}

.disponibilite-card {
  background: linear-gradient(135deg, #4DA3FF 0%, #0066FF 100%);
  border-radius: var(--sc-border-radius-lg);
  padding: var(--sc-spacing-md);
  min-width: 200px;
  position: relative;
}

.dispo-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
}

.dispo-field {
  margin-bottom: var(--sc-spacing-sm);
}

.dispo-field label {
  display: block;
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 6px;
}

.dispo-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dispo-select,
.dispo-input {
  padding: 8px 12px;
  border: none;
  border-radius: var(--sc-border-radius-sm);
  background: white;
  font-size: 14px;
  color: var(--sc-text-primary);
}

.dispo-input.time {
  width: 90px;
}

.recurring-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
}

.recurring-toggle input {
  width: 16px;
  height: 16px;
}

.add-dispo-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  transition: background 0.2s;
}

.add-dispo-btn:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Step 4: Infos études */
.infos-form {
  display: flex;
  flex-direction: column;
  gap: var(--sc-spacing-md);
  margin-top: var(--sc-spacing-lg);
}

.form-field label {
  display: block;
  font-size: 16px;
  font-weight: var(--sc-font-weight-semibold);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: none;
  border-radius: var(--sc-border-radius-sm);
  background: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  color: var(--sc-text-primary);
}

.form-input::placeholder {
  color: var(--sc-text-secondary);
}

/* Navigation */
.onboarding-nav {
  margin-top: auto;
  padding-top: var(--sc-spacing-lg);
}

.dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: var(--sc-spacing-md);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.2s;
}

.dot.active {
  background: white;
  transform: scale(1.2);
}

.nav-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: var(--sc-border-radius-sm);
  background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
  color: white;
  font-size: 16px;
  font-weight: var(--sc-font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

