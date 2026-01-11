<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { authToken, allUsers } from '@/store/chat.js';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'created']);

const $q = useQuasar();

const groupName = ref('');
const description = ref('');
const isOnline = ref(false);
const city = ref('');
const locationDetail = ref('');
const subject = ref('');
const maxMembers = ref(10);
const sessionDate = ref('');
const sessionTimeStart = ref('');
const sessionTimeEnd = ref('');

// Load available data
const availableCities = ref([]);
const availableSubjects = ref([]);

const subjects = [
  'Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Programmation',
  'Algèbre linéaire', 'Analyse', 'Français', 'Anglais', 'Allemand',
  'Histoire', 'Géographie', 'Économie', 'Droit', 'Marketing',
  'Gestion de projet', 'UX/UI Design', 'Autre'
];

onMounted(async () => {
  // Load cities
  try {
    const response = await fetch('/api/cities');
    if (response.ok) {
      const data = await response.json();
      availableCities.value = data.map(c => ({ id: c._id, name: c.name }));
    }
  } catch (err) {
    console.error('Error loading cities:', err);
  }
  
  // Load subjects
  try {
    const response = await fetch('/api/subjects');
    if (response.ok) {
      const data = await response.json();
      availableSubjects.value = data.map(s => ({ id: s._id, name: s.name }));
    } else {
      // Fallback to hardcoded subjects
      availableSubjects.value = subjects.map(name => ({ id: null, name }));
    }
  } catch (err) {
    availableSubjects.value = subjects.map(name => ({ id: null, name }));
  }
});

async function createGroup() {
  if (!groupName.value.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Le nom du groupe est requis',
      position: 'top'
    });
    return;
  }

  try {
    const payload = {
      title: groupName.value,
      description: description.value,
      is_online: isOnline.value,
      max_members: maxMembers.value
    };

    if (!isOnline.value && city.value) {
      payload.city_id = city.value;
    }
    
    if (locationDetail.value) {
      payload.location_detail = locationDetail.value;
    }

    if (subject.value) {
      const selectedSubject = availableSubjects.value.find(s => s.name === subject.value);
      if (selectedSubject?.id) {
        payload.subject_id = selectedSubject.id;
      }
    }

    if (sessionDate.value && sessionTimeStart.value && sessionTimeEnd.value) {
      const startDateTime = new Date(`${sessionDate.value}T${sessionTimeStart.value}`);
      const endDateTime = new Date(`${sessionDate.value}T${sessionTimeEnd.value}`);
      payload.start_time = startDateTime.toISOString();
      payload.end_time = endDateTime.toISOString();
    }

    const response = await fetch('/api/study-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken.value}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const newGroup = await response.json();
      $q.notify({
        type: 'positive',
        message: 'Groupe créé avec succès',
        position: 'top'
      });
      emit('created', newGroup);
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création');
    }
  } catch (err) {
    console.error('Error creating group:', err);
    $q.notify({
      type: 'negative',
      message: err.message || 'Erreur lors de la création du groupe',
      position: 'top'
    });
  }
}

function close() {
  // Reset form
  groupName.value = '';
  description.value = '';
  isOnline.value = false;
  city.value = '';
  locationDetail.value = '';
  subject.value = '';
  maxMembers.value = 10;
  sessionDate.value = '';
  sessionTimeStart.value = '';
  sessionTimeEnd.value = '';
  emit('close');
}
</script>

<template>
  <q-dialog :model-value="show" @hide="close">
    <q-card class="create-group-card">
      <q-card-section class="card-header">
        <div class="header-content">
          <h2>Créer un groupe</h2>
          <q-btn flat round icon="close" @click="close" />
        </div>
      </q-card-section>

      <q-card-section class="card-body">
        <q-input
          v-model="groupName"
          label="Nom du groupe *"
          outlined
          class="q-mb-md"
        />

        <q-input
          v-model="description"
          label="Description"
          type="textarea"
          outlined
          rows="3"
          class="q-mb-md"
        />

        <q-select
          v-model="subject"
          :options="availableSubjects.map(s => s.name)"
          label="Matière"
          outlined
          class="q-mb-md"
        />

        <q-toggle
          v-model="isOnline"
          label="Groupe en ligne"
          class="q-mb-md"
        />

        <q-select
          v-if="!isOnline"
          v-model="city"
          :options="availableCities"
          option-label="name"
          option-value="id"
          label="Ville"
          outlined
          class="q-mb-md"
          emit-value
          map-options
        />

        <q-input
          v-if="!isOnline"
          v-model="locationDetail"
          label="Lieu détaillé"
          outlined
          class="q-mb-md"
        />

        <q-input
          v-model.number="maxMembers"
          type="number"
          label="Nombre maximum de membres"
          outlined
          min="2"
          class="q-mb-md"
        />

        <div class="session-section">
          <h3>Session (optionnel)</h3>
          <q-input
            v-model="sessionDate"
            type="date"
            label="Date"
            outlined
            class="q-mb-md"
          />
          <div class="time-inputs">
            <q-input
              v-model="sessionTimeStart"
              type="time"
              label="Heure de début"
              outlined
              class="q-mb-md"
            />
            <q-input
              v-model="sessionTimeEnd"
              type="time"
              label="Heure de fin"
              outlined
              class="q-mb-md"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions class="card-actions">
        <q-btn flat label="Annuler" @click="close" />
        <q-btn color="primary" label="Créer" @click="createGroup" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.create-group-card {
  width: 90%;
  max-width: 500px;
  border-radius: 16px;
}

.card-header {
  padding: 20px;
  border-bottom: 1px solid #F0F0F0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.card-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.session-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #F0F0F0;
}

.session-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.time-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.card-actions {
  padding: 16px 20px;
  border-top: 1px solid #F0F0F0;
  justify-content: flex-end;
  gap: 12px;
}
</style>

