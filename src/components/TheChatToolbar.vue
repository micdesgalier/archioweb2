<script setup>
  import { isAuth, users, showUsersList, logout } from '@/store/chat.js';
  import { useQuasar } from 'quasar';
  import { onMounted } from 'vue';
  import { useJsonStorage } from '@/composables/useJsonStorage.js';

  const $q = useQuasar();
  const {data: isDark} = useJsonStorage('isDark', null);

  function handleLogout() {
    logout();
  }

  function toggleDarkMode() {
    isDark.value = !isDark.value;
    $q.dark.set(isDark.value);
  }

  function toggleUsersList() {
    showUsersList.value = !showUsersList.value;
  }

  onMounted(() => {
    if (isDark.value === null) {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    $q.dark.set(isDark.value);
  });
</script>

<template>
  <q-toolbar>
    <q-toolbar-title>
      IM - Chat
    </q-toolbar-title>
    <q-btn
      v-if="isAuth"
      flat
      round
      icon="group"
      @click="toggleUsersList"
      aria-label="Show users list"
    >
      <q-badge v-if="users.length > 0" color="primary" floating>
        {{ users.length }}
      </q-badge>
    </q-btn>
    <q-btn
      flat
      round
      :icon="isDark ? 'light_mode' : 'dark_mode'"
      @click="toggleDarkMode"
      aria-label="Toggle dark/light mode"
    />
    <q-btn
      v-if="isAuth"
      @click="handleLogout"
      label="Logout"
      icon="logout"
      color="secondary"
      size="sm"
      class="q-ml-sm"
    />
  </q-toolbar>
</template>