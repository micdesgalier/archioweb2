<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  show: Boolean,
  recipientName: String
});

const emit = defineEmits(['close', 'send']);

const sessionTitle = ref('');
const sessionSubject = ref('');
const sessionDate = ref('');
const sessionTimeStart = ref('');
const sessionTimeEnd = ref('');

const subjects = [
  'Mathématiques',
  'Physique',
  'Chimie',
  'Biologie',
  'Programmation',
  'Algèbre linéaire',
  'Analyse',
  'Français',
  'Anglais',
  'Allemand',
  'Histoire',
  'Géographie',
  'Économie',
  'Droit',
  'Marketing',
  'Gestion de projet',
  'UX/UI Design',
  'Autre'
];

const isValid = computed(() => {
  return sessionSubject.value && sessionDate.value && sessionTimeStart.value && sessionTimeEnd.value;
});

const formattedDate = computed(() => {
  if (!sessionDate.value) return '';
  const [year, month, day] = sessionDate.value.split('/');
  return `${day}.${month}.${year}`;
});

function sendProposal() {
  if (!isValid.value) return;
  
  emit('send', {
    title: sessionTitle.value || props.recipientName,
    subject: sessionSubject.value,
    date: sessionDate.value,
    dateFormatted: formattedDate.value,
    timeStart: sessionTimeStart.value,
    timeEnd: sessionTimeEnd.value,
    timeRange: `${sessionTimeStart.value} - ${sessionTimeEnd.value}`
  });
  
  // Reset form
  sessionTitle.value = '';
  sessionSubject.value = '';
  sessionDate.value = '';
  sessionTimeStart.value = '';
  sessionTimeEnd.value = '';
}

function close() {
  emit('close');
}
</script>

<template>
  <q-dialog :model-value="show" @hide="close">
    <q-card class="proposal-card">
      <q-card-section class="header">
        <div class="text-h6">Proposer une session</div>
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-card-section class="form-section">
        <div class="recipient-info">
          <q-icon name="person" size="20px" />
          <span>À : <strong>{{ recipientName }}</strong></span>
        </div>

        <q-input
          v-model="sessionTitle"
          label="Titre (optionnel)"
          outlined
          dense
          class="q-mb-md"
          placeholder="Ex: Révisions prog"
        />

        <q-select
          v-model="sessionSubject"
          :options="subjects"
          label="Matière *"
          outlined
          dense
          class="q-mb-md"
          emit-value
          map-options
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

        <div class="time-row">
          <q-input
            v-model="sessionTimeStart"
            label="Heure début *"
            outlined
            dense
            class="time-input"
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

          <span class="time-separator">-</span>

          <q-input
            v-model="sessionTimeEnd"
            label="Heure fin *"
            outlined
            dense
            class="time-input"
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

      <q-card-actions class="actions">
        <q-btn flat label="Annuler" @click="close" />
        <q-btn 
          unelevated 
          label="Envoyer la proposition" 
          color="primary" 
          :disable="!isValid"
          @click="sendProposal"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.proposal-card {
  width: 100%;
  max-width: 450px;
  border-radius: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #E5E7EB;
}

.form-section {
  padding: 16px 24px;
}

.recipient-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background: #F0F7FF;
  border-radius: 8px;
  color: var(--sc-primary-blue);
}

.time-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-input {
  flex: 1;
}

.time-separator {
  font-size: 18px;
  color: #9E9E9E;
}

.actions {
  padding: 16px 24px;
  border-top: 1px solid #E5E7EB;
  justify-content: flex-end;
  gap: 8px;
}
</style>

