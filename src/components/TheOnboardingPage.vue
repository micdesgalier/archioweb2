<script setup>
import { ref } from 'vue';

const emit = defineEmits(['complete']);

const currentStep = ref(1);
const totalSteps = 4;

// Form data
const formData = ref({
  studyYear: null,
  institution: '',
  field: '',
  city: '',
  canHelpSubjects: [],
  needsHelpSubjects: [],
  availability: [],
  bio: ''
});

const studyYears = [
  { label: '1ère année', value: 1 },
  { label: '2ème année', value: 2 },
  { label: '3ème année', value: 3 },
  { label: '4ème année', value: 4 },
  { label: '5ème année+', value: 5 }
];

const subjects = [
  'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Programmation',
  'Algèbre linéaire', 'Analyse', 'Français', 'Anglais', 'Allemand',
  'Histoire', 'Géographie', 'Économie', 'Droit', 'Marketing'
];

const cities = ['Lausanne', 'Yverdon-les-Bains', 'Bussigny', 'Montreux', 'Neuchâtel', 'Vevey'];

function nextStep() {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function completeOnboarding() {
  // TODO: Save onboarding data to backend
  emit('complete', formData.value);
}

function canProceed() {
  switch (currentStep.value) {
    case 1:
      return formData.value.studyYear && formData.value.institution;
    case 2:
      return formData.value.city;
    case 3:
      return formData.value.canHelpSubjects.length > 0 || formData.value.needsHelpSubjects.length > 0;
    case 4:
      return true;
    default:
      return false;
  }
}
</script>

<template>
  <div class="onboarding-page">
    <div class="onboarding-container">
      <!-- Progress -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${(currentStep / totalSteps) * 100}%` }"></div>
      </div>
      <div class="step-indicator">Étape {{ currentStep }} / {{ totalSteps }}</div>

      <!-- Step 1: Studies -->
      <div v-if="currentStep === 1" class="step-content">
        <h2>📚 Tes études</h2>
        <p>Dis-nous où tu en es dans ton parcours</p>
        
        <q-select
          v-model="formData.studyYear"
          :options="studyYears"
          label="Année d'études"
          outlined
          emit-value
          map-options
          class="q-mb-md"
        />
        
        <q-input
          v-model="formData.institution"
          label="Établissement"
          outlined
          placeholder="Ex: HEIG-VD, EPFL..."
          class="q-mb-md"
        />
        
        <q-input
          v-model="formData.field"
          label="Domaine d'études"
          outlined
          placeholder="Ex: Informatique, Économie..."
        />
      </div>

      <!-- Step 2: Location -->
      <div v-if="currentStep === 2" class="step-content">
        <h2>📍 Ta localisation</h2>
        <p>Pour te matcher avec des étudiants proches</p>
        
        <q-select
          v-model="formData.city"
          :options="cities"
          label="Ville"
          outlined
          class="q-mb-md"
        />
      </div>

      <!-- Step 3: Subjects -->
      <div v-if="currentStep === 3" class="step-content">
        <h2>🎯 Tes matières</h2>
        <p>Sélectionne les matières où tu peux aider ou où tu as besoin d'aide</p>
        
        <div class="q-mb-lg">
          <label class="section-label">Je peux aider en :</label>
          <q-select
            v-model="formData.canHelpSubjects"
            :options="subjects"
            label="Matières"
            outlined
            multiple
            use-chips
          />
        </div>
        
        <div>
          <label class="section-label">J'ai besoin d'aide en :</label>
          <q-select
            v-model="formData.needsHelpSubjects"
            :options="subjects"
            label="Matières"
            outlined
            multiple
            use-chips
          />
        </div>
      </div>

      <!-- Step 4: Bio -->
      <div v-if="currentStep === 4" class="step-content">
        <h2>✨ Dernière étape</h2>
        <p>Parle un peu de toi</p>
        
        <q-input
          v-model="formData.bio"
          label="Bio (optionnel)"
          outlined
          type="textarea"
          rows="4"
          placeholder="Quelques mots sur toi, tes passions..."
        />
      </div>

      <!-- Navigation -->
      <div class="nav-buttons">
        <q-btn 
          v-if="currentStep > 1"
          flat 
          label="Retour" 
          @click="prevStep"
        />
        <q-space />
        <q-btn 
          v-if="currentStep < totalSteps"
          unelevated
          color="primary"
          label="Continuer"
          :disable="!canProceed()"
          @click="nextStep"
        />
        <q-btn 
          v-else
          unelevated
          color="primary"
          label="Terminer"
          @click="completeOnboarding"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #4A90D9 0%, #6BA8E8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.onboarding-container {
  background: white;
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.progress-bar {
  height: 6px;
  background: #E5E7EB;
  border-radius: 3px;
  margin-bottom: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4A90D9, #22C55E);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.step-indicator {
  text-align: center;
  color: #6B7280;
  font-size: 14px;
  margin-bottom: 24px;
}

.step-content {
  min-height: 300px;
}

.step-content h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--sc-text-primary);
  margin: 0 0 8px;
}

.step-content p {
  color: #6B7280;
  margin: 0 0 24px;
}

.section-label {
  display: block;
  font-weight: 600;
  color: var(--sc-text-primary);
  margin-bottom: 8px;
}

.nav-buttons {
  display: flex;
  align-items: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #E5E7EB;
}
</style>

