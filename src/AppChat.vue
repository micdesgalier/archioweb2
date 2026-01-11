<script setup>
  import { onMounted, onUnmounted, ref, watch, computed } from 'vue';
  import { useQuasar } from 'quasar';
  import { isAuth, ws, users, allMsg } from '@/store/chat.js';
  import TheLoginPage from './components/TheLoginPage.vue';
  import TheSignUpPage from './components/TheSignUpPage.vue';
  import TheOnboardingPage from './components/TheOnboardingPage.vue';
  import TheBottomNav from './components/TheBottomNav.vue';
  import TheHomePage from './components/TheHomePage.vue';
  import TheDiscussionsList from './components/TheDiscussionsList.vue';
  import TheChatDetail from './components/TheChatDetail.vue';
  import TheProfilePage from './components/TheProfilePage.vue';
  import TheMatchPage from './components/TheMatchPage.vue';
  import TheGroupsPage from './components/TheGroupsPage.vue';
  import { connectToChat, logout } from '@/store/chat.js';

  // Auth page state: 'login' or 'signup'
  const authPage = ref('login');
  
  // Onboarding state
  const needsOnboarding = ref(false);
  // Set to false to disable forced onboarding
  const showOnboarding = ref(false);

  // Navigation state
  const currentTab = ref('home');
  const currentChat = ref(null);
  const showCalendar = ref(false);
  const selectedDate = ref(new Date().toISOString().split('T')[0]);

  // Calendar events data
  const calendarEvents = ref([
    {
      id: 1,
      title: 'Groupe HEIG-VD',
      subject: 'Révisions prog',
      date: '2026/03/18',
      time: '14:00 - 16:30',
      color: '#4A90D9'
    },
    {
      id: 2,
      title: 'Mattias',
      subject: 'Aide pour maths',
      date: '2026/03/19',
      time: '17:00 - 19:00',
      color: '#4A90D9'
    },
    {
      id: 3,
      title: 'Alice',
      subject: 'Programmation Python',
      date: '2026/01/07',
      time: '10:00 - 11:30',
      color: '#22C55E'
    },
    {
      id: 4,
      title: 'Bob',
      subject: 'Algèbre linéaire',
      date: '2026/01/10',
      time: '14:00 - 15:30',
      color: '#FBBF24'
    }
  ]);

  // Get events for selected date
  const eventsForSelectedDate = computed(() => {
    return calendarEvents.value.filter(event => event.date === selectedDate.value);
  });

  // Get dates with events for calendar highlighting
  const eventDates = computed(() => {
    return calendarEvents.value.map(e => e.date);
  });

  function handleSignupComplete() {
    console.log('🎉 Signup complete - setting needsOnboarding to true');
    authPage.value = 'login';
    needsOnboarding.value = true;
  }

  // Watch for successful login and show onboarding if needed
  watch(isAuth, (newValue) => {
    console.log('👤 isAuth changed to:', newValue, '| needsOnboarding:', needsOnboarding.value);
    if (newValue && needsOnboarding.value) {
      console.log('🚀 Showing onboarding!');
      showOnboarding.value = true;
    }
  });

  function handleOnboardingComplete(data) {
    console.log('Onboarding completed:', data);
    showOnboarding.value = false;
    needsOnboarding.value = false;
  }

  function changeTab(tabId) {
    currentTab.value = tabId;
    currentChat.value = null; // Close chat when changing tabs
    showCalendar.value = false;
  }

  function openChat(discussion) {
    currentChat.value = discussion;
  }

  function closeChat() {
    currentChat.value = null;
  }

  function openCalendar() {
    showCalendar.value = true;
  }

  function closeCalendar() {
    showCalendar.value = false;
  }

  function addSessionToCalendar(session) {
    console.log('📅 AppChat.addSessionToCalendar called with:', session);
    if (!session || !session.date) {
      console.error('❌ Invalid session data:', session);
      return;
    }
    const newEvent = {
      id: Date.now(),
      title: session.partner || session.title || 'Session',
      subject: session.subject || 'Session',
      date: session.date,
      time: session.timeRange || session.time || '14:00 - 16:00',
      color: '#22C55E' // Green for accepted sessions
    };
    calendarEvents.value.push(newEvent);
    console.log('✅ Session added to calendar:', newEvent);
    console.log('📊 Total calendar events:', calendarEvents.value.length);
    $q.notify({
      type: 'positive',
      message: 'Session ajoutée au calendrier',
      position: 'top',
      timeout: 2000
    });
  }

  async function handleLogout() {
    await logout();
  }

  const $q = useQuasar();

  ws.on('close', () => {
    if (isAuth.value) {
      $q.notify({
        type: 'negative',
        message: 'Connection to server lost',
        timeout: 2000,
        position: 'top',
      });
    }
    isAuth.value = false;
    users.value = [];
    allMsg.value = [];
  });

  function handleVisibilityChange() {
    if (document.visibilityState != 'visible' || isAuth.value) return;
    connectToChat().catch(() => {});
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    connectToChat().catch(() => {});
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });
</script>

<template>
  <router-view />
  <!-- Onboarding -->
  <TheOnboardingPage 
    v-if="showOnboarding" 
    @complete="handleOnboardingComplete" 
  />

  <!-- Pages d'authentification -->
  <template v-else-if="!isAuth">
    <TheLoginPage v-if="authPage === 'login'" @switch-to-signup="authPage = 'signup'" />
    <TheSignUpPage v-else @switch-to-login="handleSignupComplete" />
  </template>
  
  <!-- App principale avec navigation -->
  <div v-else class="app-container">
    <!-- Chat Detail (full screen overlay) -->
    <TheChatDetail 
      v-if="currentChat" 
      :discussion="currentChat"
      @back="closeChat"
      @session-accepted="addSessionToCalendar"
    />

    <!-- Main content with bottom nav -->
    <template v-else>
      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Calendar View (full screen) -->
        <div v-if="showCalendar" class="calendar-page">
          <header class="calendar-header">
            <button class="back-btn" @click="closeCalendar">
              <q-icon name="chevron_left" />
            </button>
            <h1>Calendrier</h1>
            <button class="add-btn">
              <q-icon name="add" />
            </button>
          </header>
          <div class="calendar-content">
            <q-date 
              v-model="selectedDate" 
              flat 
              class="full-width-calendar app-calendar"
              first-day-of-week="1"
              :events="eventDates"
              event-color="primary"
              color="primary"
            />
            <div class="calendar-events">
              <h3>Événements du jour</h3>
              <div v-if="eventsForSelectedDate.length > 0" class="events-list">
                <div 
                  v-for="event in eventsForSelectedDate" 
                  :key="event.id"
                  class="event-card"
                  :style="{ borderLeftColor: event.color }"
                >
                  <div class="event-info">
                    <span class="event-title">{{ event.title }}</span>
                    <span class="event-subject">{{ event.subject }}</span>
                  </div>
                  <div class="event-time">
                    <q-icon name="schedule" size="16px" />
                    <span>{{ event.time }}</span>
                  </div>
                </div>
              </div>
              <p v-else class="no-events">Aucun événement prévu</p>
            </div>
          </div>
        </div>

        <!-- Home Tab -->
        <TheHomePage 
          v-else-if="currentTab === 'home'"
          @open-chat="openChat"
          @open-calendar="openCalendar"
        />

        <!-- Discussions Tab -->
        <TheDiscussionsList 
          v-else-if="currentTab === 'discussions'"
          @open-chat="openChat"
        />

        <!-- Match Tab -->
        <TheMatchPage 
          v-else-if="currentTab === 'favorites'"
          @open-chat="openChat"
        />

        <TheGroupsPage 
          v-else-if="currentTab === 'groups'"
          @open-chat="openChat"
          @session-added="addSessionToCalendar"
        />

        <TheProfilePage 
          v-else-if="currentTab === 'profile'"
          @logout="handleLogout"
        />
      </div>

      <!-- Bottom Navigation -->
      <TheBottomNav 
        :current-tab="currentTab"
        @change-tab="changeTab"
      />
    </template>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #F5F5F5;
}

.tab-content {
  min-height: 100vh;
}

.placeholder-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding-bottom: 80px;
  color: var(--sc-text-secondary);
  background: white;
}

.placeholder-page p {
  margin: 16px 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--sc-text-primary);
}

.placeholder-page span {
  font-size: 14px;
}

/* Calendar Page */
.calendar-page {
  min-height: 100vh;
  background: white;
  padding-bottom: 80px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #F0F0F0;
}

.calendar-header h1 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: var(--sc-text-primary);
}

.calendar-header .back-btn,
.calendar-header .add-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--sc-primary-blue);
}

.calendar-header .back-btn .q-icon,
.calendar-header .add-btn .q-icon {
  font-size: 24px;
}

.calendar-content {
  padding: 16px;
}

.full-width-calendar {
  width: 100%;
  max-width: 100%;
}

.calendar-events {
  margin-top: 24px;
}

.calendar-events h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--sc-text-primary);
  margin: 0 0 12px;
}

.no-events {
  color: var(--sc-text-secondary);
  font-size: 14px;
  text-align: center;
}

/* Custom Calendar Styling */
.app-calendar {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.app-calendar :deep(.q-date__header) {
  background: linear-gradient(135deg, #4A90D9 0%, #3B7DC9 100%) !important;
  color: white !important;
  padding: 20px;
}

.app-calendar :deep(.q-date__header-title) {
  color: white !important;
}

.app-calendar :deep(.q-date__header-subtitle) {
  color: rgba(255, 255, 255, 0.8) !important;
}

.app-calendar :deep(.q-date__calendar) {
  background: white;
  padding: 8px;
}

.app-calendar :deep(.q-date__calendar-item--selected) {
  background: #4A90D9 !important;
  border: none !important;
  border-radius: 0 !important;
}

.app-calendar :deep(.q-date__calendar-item--selected button) {
  background: #4A90D9 !important;
  color: white !important;
  border: none !important;
  border-radius: 0 !important;
}

.app-calendar :deep(.q-date__calendar-item--selected button .q-btn__content) {
  color: white !important;
}

.app-calendar :deep(.q-date__calendar-item--selected .q-btn__content) {
  color: white !important;
}

.app-calendar :deep(.q-date__calendar-item--selected .q-btn__content span) {
  color: white !important;
}

.app-calendar :deep(.q-date__calendar-item--selected *) {
  color: white !important;
}

.app-calendar :deep(.q-date__calendar-item--selected button *) {
  color: white !important;
}

.app-calendar :deep(.q-date__calendar-item--selected span) {
  color: white !important;
}

.app-calendar :deep(.q-date__calendar-item--selected div) {
  color: white !important;
}

.app-calendar :deep(.q-date__calendar-item--selected .q-btn__wrapper) {
  color: white !important;
}

.app-calendar :deep(.q-date__calendar-item--selected .q-btn__wrapper *) {
  color: white !important;
}

.app-calendar :deep(.q-date__calendar-item--today) {
  border: none;
}

.app-calendar :deep(.q-date__navigation) {
  color: var(--sc-text-primary);
  padding: 8px 0;
  border-bottom: 1px solid #E5E7EB;
  margin-bottom: 8px;
}

.app-calendar :deep(.q-date__calendar-weekdays) {
  border-bottom: 2px solid #E5E7EB;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.app-calendar :deep(.q-date__calendar-weekdays > div) {
  color: #6B7280;
  font-weight: 700;
  font-size: 13px;
}

.app-calendar :deep(.q-date__calendar-days-container) {
  padding-top: 8px;
}

.app-calendar :deep(.q-date__calendar-item) {
  border-radius: 8px;
  margin: 2px;
  border: none !important;
  outline: none !important;
}

.app-calendar :deep(.q-date__calendar-item button) {
  border-radius: 8px;
  color: #4A90D9 !important;
  border: none !important;
  outline: none !important;
}

.app-calendar :deep(.q-date__calendar-item--fill button) {
  color: #4A90D9 !important;
}

.app-calendar :deep(.q-date__calendar-item:hover button) {
  background: #F0F7FF;
  color: #4A90D9 !important;
  border: none !important;
  outline: none !important;
}

.app-calendar :deep(.q-date__calendar-item:hover button .q-btn__content) {
  color: #4A90D9 !important;
}

.app-calendar :deep(.q-date__calendar-item:focus button) {
  border: none !important;
  outline: none !important;
}

.app-calendar :deep(.q-date__calendar-item button:focus) {
  border: none !important;
  outline: none !important;
}

.app-calendar :deep(.q-date__calendar-item:not(.q-date__calendar-item--out):not(.q-date__calendar-item--selected) button) {
  color: #4A90D9 !important;
}

.app-calendar :deep(.q-date__event) {
  display: none !important;
}

/* Week row separator */
.app-calendar :deep(.q-date__calendar-days-container .q-date__calendar-item:nth-child(7n)) {
  border-right: none;
}

.app-calendar :deep(.q-date__calendar-days-container > .row) {
  border-bottom: 1px solid #F0F0F0;
  padding: 4px 0;
}

/* Events List */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid var(--sc-primary-blue);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-title {
  font-weight: 600;
  color: var(--sc-text-primary);
  font-size: 15px;
}

.event-subject {
  color: var(--sc-text-secondary);
  font-size: 13px;
}

.event-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--sc-text-secondary);
  font-size: 13px;
  background: #F5F5F5;
  padding: 6px 12px;
  border-radius: 20px;
}

/* Desktop Responsive */
@media (min-width: 768px) {
  .app-container {
    background: #E8E8E8;
  }

  .tab-content {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-left: 1px solid #E8E8E8;
    border-right: 1px solid #E8E8E8;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  }

  .placeholder-page {
    max-width: 600px;
    margin: 0 auto;
    border-left: 1px solid #E8E8E8;
    border-right: 1px solid #E8E8E8;
  }
}

@media (min-width: 1024px) {
  .tab-content {
    max-width: 700px;
  }

  .placeholder-page {
    max-width: 700px;
  }
}
</style>

<style>
/* Global override for this app */
body:has(.app-container) {
  margin: 0;
  padding: 0;
}

#app:has(.app-container) {
  max-width: 100%;
  margin: 0;
  padding: 0;
  text-align: left;
}

/* Desktop background */
@media (min-width: 768px) {
  body:has(.app-container) {
    background: #E8E8E8;
  }
}
</style>