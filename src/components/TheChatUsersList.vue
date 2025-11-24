<script setup>
  import { computed } from 'vue';
  import { useQuasar } from 'quasar';
  import { users, showUsersList } from '@/store/chat.js';

  const $q = useQuasar();

  const sortedUsers = computed(() => {
    return users.value.toSorted((a, b) => a.localeCompare(b));
  });
</script>

<template>
  <q-drawer
    v-model="showUsersList"
    side="right"
    overlay
    :elevated="!$q.dark.isActive"
    :width="250"
    :breakpoint="0"
    class="users-drawer"
  >
    <q-scroll-area class="fit">
      <q-list padding>
        <q-item-label header class="text-h6 q-pb-sm">
          <q-icon name="group" class="q-mr-sm" />
          Users ({{ users.length }})
        </q-item-label>

        <q-separator />

        <q-item
          v-for="user in sortedUsers"
          :key="user"
          class="q-my-xs"
        >
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" size="32px">
              {{ user.charAt(0).toUpperCase() }}
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ user }}</q-item-label>
          </q-item-section>
        </q-item>

      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>

<style scoped>
  .users-drawer {
    background: var(--q-background);
  }
</style>
