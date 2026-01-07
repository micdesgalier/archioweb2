<script setup>
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import { useQuasar } from 'quasar';
  import { isAuth, ws, users, allMsg } from '@/store/chat.js';
  import TheLoginPage from './components/TheLoginPage.vue';
  import TheSignUpPage from './components/TheSignUpPage.vue';
  import TheOnboardingPage from './components/TheOnboardingPage.vue';
  import TheBottomNav from './components/TheBottomNav.vue';
  import TheDiscussionsList from './components/TheDiscussionsList.vue';
  import TheChatDetail from './components/TheChatDetail.vue';
  import { connectToChat } from '@/store/chat.js';

  // Auth page state: 'login' or 'signup'
  const authPage = ref('login');
  
  // Onboarding state
  const needsOnboarding = ref(false);
  // Set to false to disable forced onboarding
  const showOnboarding = ref(false);

  // Navigation state
  const currentTab = ref('discussions');
  const currentChat = ref(null);

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
  }

  function openChat(discussion) {
    currentChat.value = discussion;
  }

  function closeChat() {
    currentChat.value = null;
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
    />

    <!-- Main content with bottom nav -->
    <template v-else>
      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Discussions Tab -->
        <TheDiscussionsList 
          v-if="currentTab === 'discussions'"
          @open-chat="openChat"
        />

        <!-- Other tabs (placeholders) -->
        <div v-else-if="currentTab === 'home'" class="placeholder-page">
          <q-icon name="school" size="64px" color="grey-5" />
          <p>Accueil</p>
          <span>Bientôt disponible</span>
        </div>

        <div v-else-if="currentTab === 'favorites'" class="placeholder-page">
          <q-icon name="favorite" size="64px" color="grey-5" />
          <p>Favoris</p>
          <span>Bientôt disponible</span>
        </div>

        <div v-else-if="currentTab === 'groups'" class="placeholder-page">
          <q-icon name="groups" size="64px" color="grey-5" />
          <p>Groupes</p>
          <span>Bientôt disponible</span>
        </div>

        <div v-else-if="currentTab === 'profile'" class="placeholder-page">
          <q-icon name="person" size="64px" color="grey-5" />
          <p>Profil</p>
          <span>Bientôt disponible</span>
        </div>
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
