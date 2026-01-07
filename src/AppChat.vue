<script setup>
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import { useQuasar } from 'quasar';
  import { isAuth, ws, users, allMsg } from '@/store/chat.js';
  import TheChatToolbar from './components/TheChatToolbar.vue';
  import TheLoginPage from './components/TheLoginPage.vue';
  import TheSignUpPage from './components/TheSignUpPage.vue';
  import TheOnboardingPage from './components/TheOnboardingPage.vue';
  import TheChatForm from './components/TheChatForm.vue';
  import TheChatMessagesList from './components/TheChatMessagesList.vue';
  import TheChatUsersList from './components/TheChatUsersList.vue';
  import { connectToChat } from '@/store/chat.js';

  // Auth page state: 'login' or 'signup'
  const authPage = ref('login');
  
  // Onboarding state
  const needsOnboarding = ref(false);
  // FORCE ONBOARDING TO TRUE FOR TESTING - remove this later
  const showOnboarding = ref(true);

  function handleSignupComplete() {
    console.log('🎉 Signup complete - setting needsOnboarding to true');
    authPage.value = 'login';
    needsOnboarding.value = true; // New user needs onboarding
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
    // TODO: Save onboarding data to backend
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
  <!-- FORCE ONBOARDING FOR TESTING -->
  <TheOnboardingPage 
    v-if="showOnboarding" 
    @complete="handleOnboardingComplete" 
  />

  <!-- Pages d'authentification sans layout Quasar -->
  <template v-else-if="!isAuth">
    <TheLoginPage v-if="authPage === 'login'" @switch-to-signup="authPage = 'signup'" />
    <TheSignUpPage v-else @switch-to-login="handleSignupComplete" />
  </template>
  
  <!-- Chat avec layout Quasar -->
  <q-layout v-else view="hHh lpr lFf">
    <q-header :class="{ 'no-shadow': $q.dark.isActive }" :elevated="!$q.dark.isActive">
      <TheChatToolbar />
    </q-header>

    <TheChatUsersList />

    <q-page-container>
      <q-page padding>
        <TheChatMessagesList />
      </q-page>
    </q-page-container>

    <q-footer class="q-pa-xs" :class="{ 'bg-dark': $q.dark.isActive, 'bg-grey-2': !$q.dark.isActive }">
      <TheChatForm />
    </q-footer>
  </q-layout>
</template>

<style scoped>
  .q-page-container {
    max-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .q-page {
    overflow-y: auto;
  }

  .no-scroll {
    overflow: hidden;
  }

  .no-shadow {
    box-shadow: none;
  }
</style>