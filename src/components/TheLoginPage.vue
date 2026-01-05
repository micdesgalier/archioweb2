<script setup>
  import { ref } from 'vue';
  import { connectToChat } from '@/store/chat.js';
  import { useFetchJson } from '@/composables/useFetchJson';
  import UserIcon from '@/assets/bx_bx-user.svg';
  import LockIcon from '@/assets/emojione-monotone_locked-with-key.svg';
  import BooksIcon from '@/assets/twemoji_books.svg';

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
  <div class="sc-login-page">
    <!-- Header bleu avec gradient -->
    <div class="sc-header">
      <button class="sc-back-button" @click.prevent>
        <q-icon name="arrow_back" />
      </button>
      <h1 class="sc-title">Study Connect</h1>
      <h2 class="sc-subtitle">Connexion</h2>
    </div>

    <!-- Contenu blanc -->
    <div class="sc-content">
      <h3 class="sc-welcome">Te voilà de retour!</h3>
      <p class="sc-instructions">Se connecter et continuer les révisions</p>

      <form @submit.prevent="handleSubmit" class="sc-form">
        <!-- Champ Pseudo ou email -->
        <div class="sc-form-group">
          <label class="sc-label">
            <img :src="UserIcon" alt="User" class="sc-label-icon" />
            Pseudo ou email
          </label>
          <input
            v-model="username"
            type="text"
            class="sc-input"
            placeholder="Entrer votre pseudo ou email"
            :disabled="loading"
            autofocus
            maxlength="20"
          />
        </div>

        <!-- Champ Mot de passe -->
        <div class="sc-form-group">
          <label class="sc-label">
            <img :src="LockIcon" alt="Lock" class="sc-label-icon" />
            Mot de passe
          </label>
          <div class="sc-input-wrapper">
            <input
              v-model="password"
              :type="isPwd ? 'password' : 'text'"
              class="sc-input sc-input-password"
              placeholder="Entrer votre mot de passe"
              :disabled="loading"
            />
            <button
              type="button"
              @click="isPwd = !isPwd"
              class="sc-password-toggle"
            >
              <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" />
            </button>
          </div>
        </div>

        <!-- Lien mot de passe oublié -->
        <div style="text-align: right; margin-bottom: var(--sc-spacing-md);">
          <a href="#" class="sc-link">Mot de passe oublié ?</a>
        </div>

        <!-- Message d'erreur -->
        <div v-if="error" style="background: #FFE5E5; color: #D32F2F; padding: 12px; border-radius: var(--sc-border-radius-sm); margin-bottom: var(--sc-spacing-md); font-size: 14px;">
          {{ error }}
        </div>

        <!-- Bouton Connexion -->
        <button
          type="submit"
          class="sc-button"
          :disabled="!username || !password || loading"
        >
          <span v-if="loading">Connexion...</span>
          <span v-else>Connexion</span>
        </button>
      </form>

      <!-- Lien inscription -->
      <div class="sc-signup-link">
        Pas encore de compte? <a href="#" class="sc-link">S'inscrire</a>
      </div>
    </div>

    <!-- Section décorative avec livres -->
    <div class="sc-decorative-section">
      <div class="sc-books-decoration">
        <img :src="BooksIcon" alt="Books" class="sc-books-image" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sc-login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--sc-bg-white);
  margin: 0;
  padding: 0;
}

.sc-form {
  width: 100%;
}

.sc-input-wrapper {
  position: relative;
  width: 100%;
}

.sc-input-password {
  padding-right: 45px;
}

.sc-password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--sc-text-secondary);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.sc-password-toggle:hover {
  color: var(--sc-primary-blue);
}
</style>
