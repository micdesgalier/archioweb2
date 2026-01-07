<script setup>
  import { ref } from 'vue';
  import { useFetchJson } from '@/composables/useFetchJson';
  import UserIcon from '@/assets/bx_bx-user.svg';
  import LockIcon from '@/assets/emojione-monotone_locked-with-key.svg';

  const emit = defineEmits(['switch-to-login']);

  const nom = ref('');
  const prenom = ref('');
  const email = ref('');
  const dateNaissance = ref('');
  const password = ref('');
  const isPwd = ref(true);
  const error = ref('');
  const success = ref('');

  const { data: signupData, execute: signupAPI, loading, error: apiError } = useFetchJson({
    url: '/api/auth/register',
    method: 'POST',
    immediate: false
  });

  async function handleSubmit() {
    error.value = '';
    success.value = '';
    try {
      await signupAPI({
        nom: nom.value,
        prenom: prenom.value,
        email: email.value,
        dateNaissance: dateNaissance.value,
        password: password.value
      });
      if (apiError.value) throw new Error(apiError.value?.data?.error);
      // Show success message and redirect to login
      success.value = 'Compte créé avec succès ! Redirection vers la connexion...';
      setTimeout(() => {
        emit('switch-to-login');
      }, 2000);
    } catch (err) {
      error.value = err.message || 'Inscription échouée';
    }
  }

  function goToLogin() {
    emit('switch-to-login');
  }
</script>

<template>
  <div class="signup-page">
    <!-- Header bleu avec gradient -->
    <div class="signup-header">
      <button class="signup-back-button" @click="goToLogin">
        <q-icon name="arrow_back" />
      </button>
      <h1 class="signup-title">Study Connect</h1>
      <h2 class="signup-subtitle">Inscription</h2>
    </div>

    <!-- Contenu blanc -->
    <div class="signup-content">
      <h3 class="signup-welcome">Crée un compte</h3>
      <p class="signup-instructions">Remplir les différents champs pour créer un compte</p>

      <form @submit.prevent="handleSubmit" class="signup-form">
        <!-- Champ Nom -->
        <div class="signup-form-group">
          <label class="signup-label">
            <img :src="UserIcon" alt="User" class="signup-label-icon" />
            Nom
          </label>
          <input
            v-model="nom"
            type="text"
            class="signup-input"
            placeholder="Entrer votre nom"
            :disabled="loading"
            autofocus
          />
        </div>

        <!-- Champ Prénom -->
        <div class="signup-form-group">
          <label class="signup-label">
            <img :src="UserIcon" alt="User" class="signup-label-icon" />
            Prénom
          </label>
          <input
            v-model="prenom"
            type="text"
            class="signup-input"
            placeholder="Entrer votre numéro de téléphone"
            :disabled="loading"
          />
        </div>

        <!-- Champ Adresse email -->
        <div class="signup-form-group">
          <label class="signup-label">
            <q-icon name="mail_outline" class="signup-label-icon-q" />
            Adresse email
          </label>
          <input
            v-model="email"
            type="email"
            class="signup-input"
            placeholder="Entrer votre adresse email"
            :disabled="loading"
          />
        </div>

        <!-- Champ Date de naissance -->
        <div class="signup-form-group">
          <label class="signup-label">
            <q-icon name="mail_outline" class="signup-label-icon-q" />
            Date de naissance
          </label>
          <input
            v-model="dateNaissance"
            type="text"
            class="signup-input"
            placeholder="Entrer votre date d'anniversaire"
            :disabled="loading"
            onfocus="(this.type='date')"
            onblur="(this.type='text')"
          />
        </div>

        <!-- Champ Mot de passe -->
        <div class="signup-form-group">
          <label class="signup-label">
            <img :src="LockIcon" alt="Lock" class="signup-label-icon" />
            Mot de passe
          </label>
          <div class="signup-input-wrapper">
            <input
              v-model="password"
              :type="isPwd ? 'password' : 'text'"
              class="signup-input signup-input-password"
              placeholder="Entrez votre mot de passe"
              :disabled="loading"
            />
            <button
              type="button"
              @click="isPwd = !isPwd"
              class="signup-password-toggle"
            >
              <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" />
            </button>
          </div>
        </div>

        <!-- Message d'erreur -->
        <div v-if="error" class="signup-error">
          {{ error }}
        </div>

        <!-- Message de succès -->
        <div v-if="success" class="signup-success">
          {{ success }}
        </div>

        <!-- Bouton Inscription -->
        <button
          type="submit"
          class="signup-button"
          :disabled="!nom || !prenom || !email || !password || loading"
        >
          <span v-if="loading">Inscription...</span>
          <span v-else>Inscription</span>
        </button>
      </form>

      <!-- Lien connexion -->
      <div class="signup-login-link">
        Déja membre ? <a href="#" class="signup-link" @click.prevent="goToLogin">Se connecter</a>
      </div>
    </div>

    <!-- Section décorative bleue -->
    <div class="signup-decorative-section"></div>
  </div>
</template>

<style scoped>
/* Override global #app styles pour la page signup */
:global(body:has(.signup-page)) {
  display: block;
  place-items: unset;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}

:global(#app:has(.signup-page)) {
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  text-align: left;
  min-height: 100vh;
}

/* Page container */
.signup-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--sc-bg-white);
  margin: 0;
  padding: 0;
}

/* Header */
.signup-header {
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

.signup-header::after {
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

.signup-back-button {
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

.signup-back-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.signup-title {
  font-size: 28px;
  font-weight: var(--sc-font-weight-bold);
  text-align: center;
  color: var(--sc-text-white);
  margin-bottom: var(--sc-spacing-sm);
}

.signup-subtitle {
  font-size: 24px;
  font-weight: var(--sc-font-weight-bold);
  text-align: left;
  color: var(--sc-text-white);
  margin-bottom: var(--sc-spacing-lg);
}

/* Content area */
.signup-content {
  background: var(--sc-bg-white);
  padding: var(--sc-spacing-lg) var(--sc-spacing-md);
  position: relative;
  z-index: 1;
  flex: 1;
  border-radius: 35px 0 35px 0;
  margin-top: -1px;
  animation: fadeInUp 0.4s ease-out;
}

.signup-welcome {
  font-size: 24px;
  font-weight: var(--sc-font-weight-semibold);
  color: var(--sc-text-primary);
  margin-bottom: var(--sc-spacing-xs);
}

.signup-instructions {
  font-size: 14px;
  color: var(--sc-text-secondary);
  margin-bottom: var(--sc-spacing-md);
}

/* Form */
.signup-form {
  width: 100%;
}

.signup-form-group {
  margin-bottom: var(--sc-spacing-sm);
}

.signup-label {
  display: flex;
  align-items: center;
  gap: var(--sc-spacing-xs);
  font-size: 14px;
  font-weight: var(--sc-font-weight-medium);
  color: var(--sc-text-primary);
  margin-bottom: var(--sc-spacing-xs);
}

.signup-label-icon {
  width: 18px;
  height: 18px;
  display: inline-block;
  flex-shrink: 0;
}

.signup-label-icon-q {
  font-size: 18px;
  color: var(--sc-text-primary);
}

.signup-input {
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

.signup-input:focus {
  outline: none;
  background-color: #E8EDF2;
}

.signup-input::placeholder {
  color: var(--sc-text-secondary);
}

.signup-input-wrapper {
  position: relative;
  width: 100%;
}

.signup-input-password {
  padding-right: 45px;
}

.signup-password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #E57373;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.signup-password-toggle:hover {
  color: var(--sc-primary-blue);
}

/* Links */
.signup-link {
  color: var(--sc-primary-blue);
  text-decoration: none;
  font-size: 14px;
  font-weight: var(--sc-font-weight-medium);
  transition: color 0.2s ease;
}

.signup-link:hover {
  color: var(--sc-primary-blue-dark);
  text-decoration: underline;
}

/* Button */
.signup-button {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: var(--sc-border-radius-sm);
  background: linear-gradient(135deg, #7B8EEC 0%, #6B7FE3 100%);
  color: var(--sc-text-white);
  font-size: 16px;
  font-weight: var(--sc-font-weight-semibold);
  font-family: var(--sc-font-family);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin-top: var(--sc-spacing-md);
}

.signup-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(123, 142, 236, 0.3);
}

.signup-button:active {
  transform: translateY(0);
}

.signup-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Login link */
.signup-login-link {
  text-align: center;
  margin-top: var(--sc-spacing-md);
  font-size: 14px;
  color: var(--sc-text-secondary);
}

.signup-login-link .signup-link {
  margin-left: 4px;
}

/* Error message */
.signup-error {
  background: #FFE5E5;
  color: #D32F2F;
  padding: 12px;
  border-radius: var(--sc-border-radius-sm);
  margin-bottom: var(--sc-spacing-sm);
  font-size: 14px;
}

/* Success message */
.signup-success {
  background: #E8F5E9;
  color: #2E7D32;
  padding: 12px;
  border-radius: var(--sc-border-radius-sm);
  margin-bottom: var(--sc-spacing-sm);
  font-size: 14px;
}

/* Decorative section */
.signup-decorative-section {
  background: radial-gradient(ellipse at center bottom, #0066FF 0%, #0046FB 50%, #0035C0 100%);
  min-height: 80px;
  height: 80px;
  position: relative;
  border-radius: 0;
  margin-top: 0;
}

.signup-decorative-section::before {
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
  .signup-content {
    padding: var(--sc-spacing-xl) var(--sc-spacing-lg);
  }
}
</style>

