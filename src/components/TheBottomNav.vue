<script setup>
const props = defineProps({
  currentTab: {
    type: String,
    default: 'discussions'
  }
});

const emit = defineEmits(['change-tab']);

const tabs = [
  { id: 'home', icon: 'school', label: 'Accueil' },
  { id: 'favorites', icon: 'favorite_border', label: 'Favoris' },
  { id: 'groups', icon: 'groups', label: 'Groupes' },
  { id: 'discussions', icon: 'chat_bubble_outline', label: 'Discussions' },
  { id: 'profile', icon: 'person_outline', label: 'Profil' }
];

function selectTab(tabId) {
  emit('change-tab', tabId);
}
</script>

<template>
  <nav class="bottom-nav">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="nav-tab"
      :class="{ active: currentTab === tab.id }"
      @click="selectTab(tab.id)"
    >
      <q-icon :name="tab.icon" />
    </button>
  </nav>
</template>

<style scoped>
.bottom-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: white;
  padding: 12px 0;
  border-top: 1px solid #E8E8E8;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  color: #9E9E9E;
  transition: color 0.2s;
}

.nav-tab .q-icon {
  font-size: 24px;
}

.nav-tab.active {
  color: var(--sc-primary-blue);
}

.nav-tab.active .q-icon {
  color: var(--sc-primary-blue);
}

/* Desktop Responsive */
@media (min-width: 768px) {
  .bottom-nav {
    max-width: 600px;
    margin: 0 auto;
    border-left: 1px solid #E8E8E8;
    border-right: 1px solid #E8E8E8;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0;
  }
}

@media (min-width: 1024px) {
  .bottom-nav {
    max-width: 700px;
  }
}
</style>

