<script setup>
  import { ref } from 'vue';
  import { connectToChat } from '@/store/chat.js';
  import { useFetchJson } from '@/composables/useFetchJson';

  const username = ref('');
  const password = ref('');
  const rememberMe = ref(false);
  const isPwd = ref(true);
  const error = ref('');

  const usernameRules = [
    val => !!val || 'Username is required',
    val => val.length <= 20 || 'Maximum 20 characters',
    val => /^[A-Za-z]+$/.test(val) || 'Only letters (A-Z, a-z) allowed'
  ];

  const {data: loginData, execute: loginAPI, loading, error: apiError } = useFetchJson({
    url: '/api/auth/login',
    method: 'POST',
    immediate: false
  });

  async function handleSubmit() {
    error.value = '';
    try {
      await loginAPI({
        username: username.value,
        password: password.value,
        rememberMe: rememberMe.value
      });
      if (apiError.value) throw new Error(apiError.value?.data?.error);
      await connectToChat(loginData.value);
    } catch (err) {
      error.value = err.message || 'Connection failed';
    }
  };
</script>

<template>
  <q-page class="flex flex-center">
    <q-card class="login-card q-pa-md" :class="{ 'no-shadow': $q.dark.isActive }">
      <q-card-section>
        <div class="text-h5 text-center q-mb-md">IM Chat</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleSubmit">
          <q-input
            v-model="username"
            label="Username"
            :rules="usernameRules"
            :disable="loading"
            outlined
            autofocus
            maxlength="20"
            counter
            class="q-mb-md"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            label="Password"
            :type="isPwd ? 'password' : 'text'"
            :disable="loading"
            outlined
            class="q-mb-md"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>

          <q-checkbox
            v-model="rememberMe"
            label="Remember me"
            :disable="loading"
            class="q-mb-md"
          />

          <q-banner v-if="error" class="bg-negative text-white q-mb-md" rounded>
            <template v-slot:avatar>
              <q-icon name="error" color="white" />
            </template>
            {{ error }}
          </q-banner>

          <q-btn
            type="submit"
            label="Login"
            color="primary"
            :loading="loading"
            :disable="!username || !password || loading"
            class="full-width"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style scoped>
  .login-card {
    width: 100%;
    max-width: 400px;
  }

  .no-shadow {
    box-shadow: none !important;
  }
</style>
