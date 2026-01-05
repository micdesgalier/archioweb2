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
/* Override global #app styles pour la page login */
:global(body:has(.sc-login-page)) {
  display: block;
  place-items: unset;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

:global(#app:has(.sc-login-page)) {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  text-align: left;
  min-height: 100vh;
}

/* Page container */
.sc-login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--sc-bg-white);
  margin: 0;
  padding: 0;
}

/* Header */
.sc-header {
  border-radius: 0;
  background: radial-gradient(ellipse at center top, #0066FF 0%, #0046FB 50%, #0035C0 100%);
  color: var(--sc-text-white);
  padding: var(--sc-spacing-lg) var(--sc-spacing-md) calc(var(--sc-spacing-lg) + 30px);
  position: relative;
  overflow: visible;
  padding-top: calc(var(--sc-spacing-md) + 20px);
  width: 100%;
  margin-top: 0;
}

.sc-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 35px;
  background: var(--sc-bg-white);
  border-radius: 35px 0 0 0;
  z-index: 1;
}

.sc-back-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--sc-text-white);
  font-size: 20px;
  margin-bottom: var(--sc-spacing-md);
  transition: background 0.2s ease;
}

.sc-back-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.sc-title {
  font-size: 28px;
  font-weight: var(--sc-font-weight-bold);
  text-align: center;
  color: var(--sc-text-white);
  margin-bottom: var(--sc-spacing-sm);
}

.sc-subtitle {
  font-size: 24px;
  font-weight: var(--sc-font-weight-bold);
  text-align: left;
  color: var(--sc-text-white);
  margin-bottom: var(--sc-spacing-lg);
}

/* Content area */
.sc-content {
  background: var(--sc-bg-white);
  padding: var(--sc-spacing-xl) var(--sc-spacing-md);
  min-height: calc(100vh - 200px);
  position: relative;
  z-index: 1;
  flex: 1;
  border-radius: 35px 0 35px 0;
  margin-top: -1px;
  animation: fadeInUp 0.4s ease-out;
}

.sc-welcome {
  font-size: 24px;
  font-weight: var(--sc-font-weight-semibold);
  color: var(--sc-text-primary);
  margin-bottom: var(--sc-spacing-xs);
}

.sc-instructions {
  font-size: 14px;
  color: var(--sc-text-secondary);
  margin-bottom: var(--sc-spacing-lg);
}

/* Form */
.sc-form {
  width: 100%;
}

.sc-form-group {
  margin-bottom: var(--sc-spacing-md);
}

.sc-label {
  display: flex;
  align-items: center;
  gap: var(--sc-spacing-xs);
  font-size: 14px;
  font-weight: var(--sc-font-weight-medium);
  color: var(--sc-text-primary);
  margin-bottom: var(--sc-spacing-xs);
}

.sc-label-icon {
  width: 18px;
  height: 18px;
  display: inline-block;
  flex-shrink: 0;
}

.sc-input {
  width: 100%;
  padding: 14px 16px;
  border: none;
  border-radius: var(--sc-border-radius-sm);
  background-color: var(--sc-bg-input);
  font-size: 16px;
  font-family: var(--sc-font-family);
  color: var(--sc-text-primary);
  transition: background-color 0.2s ease;
}

.sc-input:focus {
  outline: none;
  background-color: #E8EDF2;
}

.sc-input::placeholder {
  color: var(--sc-text-secondary);
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

/* Links */
.sc-link {
  color: var(--sc-primary-blue);
  text-decoration: none;
  font-size: 14px;
  font-weight: var(--sc-font-weight-medium);
  transition: color 0.2s ease;
}

.sc-link:hover {
  color: var(--sc-primary-blue-dark);
  text-decoration: underline;
}

/* Button */
.sc-button {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: var(--sc-border-radius-sm);
  background: linear-gradient(135deg, #0046FB 0%, #0035C0 100%);
  color: var(--sc-text-white);
  font-size: 16px;
  font-weight: var(--sc-font-weight-semibold);
  font-family: var(--sc-font-family);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: var(--sc-spacing-md);
}

.sc-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 70, 251, 0.3);
}

.sc-button:active {
  transform: translateY(0);
}

.sc-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Signup link */
.sc-signup-link {
  text-align: center;
  margin-top: var(--sc-spacing-lg);
  font-size: 14px;
  color: var(--sc-text-secondary);
}

.sc-signup-link .sc-link {
  margin-left: 4px;
}

/* Decorative section */
.sc-decorative-section {
  background: radial-gradient(ellipse at center bottom, #0066FF 0%, #0046FB 50%, #0035C0 100%);
  min-height: 160px;
  height: 160px;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: var(--sc-spacing-lg) var(--sc-spacing-md) 0;
  padding-top: 40px;
  border-radius: 0;
  margin-top: 0;
}

.sc-decorative-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 35px;
  background: var(--sc-bg-white);
  border-radius: 0 0 35px 0;
  z-index: 1;
}

.sc-books-decoration {
  width: 103px;
  height: 100px;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: -10px;
}

.sc-books-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (min-width: 768px) {
  .sc-content {
    padding: var(--sc-spacing-xl) var(--sc-spacing-lg);
  }
}
</style>
