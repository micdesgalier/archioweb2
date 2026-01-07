<script setup>
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useQuasar } from 'quasar';
  import { isAuth, ws, users, allMsg } from '@/store/chat.js';
  import TheChatToolbar from './components/TheChatToolbar.vue';
  import TheLoginPage from './components/TheLoginPage.vue';
  import TheSignUpPage from './components/TheSignUpPage.vue';
  import TheChatForm from './components/TheChatForm.vue';
  import TheChatMessagesList from './components/TheChatMessagesList.vue';
  import TheChatUsersList from './components/TheChatUsersList.vue';
  import { connectToChat } from '@/store/chat.js';

  // Auth page state: 'login' or 'signup'
  const authPage = ref('login');

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
  <!-- Pages d'authentification sans layout Quasar -->
  <template v-if="!isAuth">
    <TheLoginPage v-if="authPage === 'login'" @switch-to-signup="authPage = 'signup'" />
    <TheSignUpPage v-else @switch-to-login="authPage = 'login'" />
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