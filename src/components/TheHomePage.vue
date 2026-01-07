<script setup>
import { ref, computed, onMounted } from 'vue';
import { currentUsername, allUsers, loadAllUsers } from '@/store/chat.js';

const emit = defineEmits(['open-chat', 'open-calendar', 'open-profile']);

// Demo data for upcoming sessions
const upcomingSessions = ref([
  {
    id: 1,
    title: 'Groupe HEIG-VD',
    subject: 'Révisions prog',
    date: '18.03.2026',
    time: '14:00 - 16:30',
    color: '#4A90D9'
  },
  {
    id: 2,
    title: 'Mattias',
    subject: 'Aide pour maths',
    date: '19.03.2026',
    time: '17:00 - 19:00',
    color: '#4A90D9'
  }
]);

// Suggested users based on interests
const suggestedUsers = computed(() => {
  return allUsers.value.slice(0, 6).map((user, index) => ({
    id: user._id,
    name: user.first_name,
    fullName: `${user.first_name} ${user.last_name}`,
    avatar: user.profile_picture_url || `https://i.pravatar.cc/100?u=${user._id}`,
    tags: getRandomTags(index),
    bgColor: getBgColor(index)
  }));
});

// Demo groups
const recommendedGroups = ref([
  {
    id: 'g1',
    name: 'Groupe HEIG-VD',
    avatar: 'https://i.pravatar.cc/100?img=50',
    tags: ['programmation', 'maths'],
    bgColor: '#FEF3C7'
  },
  {
    id: 'g2',
    name: 'Lausanne - Math',
    avatar: 'https://i.pravatar.cc/100?img=51',
    tags: ['maths', 'dev'],
    bgColor: '#D1FAE5'
  },
  {
    id: 'g3',
    name: 'EPFL - Prog',
    avatar: 'https://i.pravatar.cc/100?img=52',
    tags: ['français', 'prog'],
    bgColor: '#FEE2E2'
  }
]);

function getRandomTags(index) {
  const allTags = ['programmation', 'maths', 'dev', 'français', 'physique', 'chimie'];
  const tags = [];
  tags.push(allTags[index % allTags.length]);
  tags.push(allTags[(index + 2) % allTags.length]);
  return tags;
}

function getBgColor(index) {
  const colors = ['#DBEAFE', '#E0E7FF', '#FCE7F3', '#D1FAE5', '#FEF3C7', '#FEE2E2'];
  return colors[index % colors.length];
}

function getTagColor(tag) {
  const colors = {
    'programmation': '#F97316',
    'maths': '#FBBF24',
    'dev': '#22C55E',
    'français': '#EF4444',
    'physique': '#8B5CF6',
    'chimie': '#06B6D4'
  };
  return colors[tag] || '#6B7280';
}

function openUserChat(user) {
  emit('open-chat', {
    id: user.id,
    name: user.name,
    fullName: user.fullName,
    avatar: user.avatar
  });
}

function openCalendar() {
  emit('open-calendar');
}

onMounted(() => {
  loadAllUsers();
});
</script>

<template>
  <div class="home-page">
    <!-- Header -->
    <header class="home-header">
      <button class="menu-btn">
        <q-icon name="apps" />
      </button>
      <h1 class="greeting">
        <span class="wave">👋</span> Hello {{ currentUsername || 'User' }}
      </h1>
      <button class="profile-btn" @click="$emit('open-profile')">
        <img src="https://i.pravatar.cc/100?img=47" alt="Profile" class="profile-avatar" />
      </button>
    </header>

    <!-- Upcoming Sessions -->
    <section class="section">
      <h2 class="section-title">
        <span class="title-bar"></span>
        Prochaines sessions
      </h2>
      
      <div class="sessions-list">
        <div 
          v-for="session in upcomingSessions" 
          :key="session.id"
          class="session-card"
          :style="{ background: `linear-gradient(135deg, ${session.color} 0%, ${session.color}dd 100%)` }"
        >
          <div class="session-left">
            <span class="session-title">{{ session.title }}</span>
            <span class="session-subject">{{ session.subject }}</span>
          </div>
          <div class="session-right">
            <span class="session-date">{{ session.date }}</span>
            <span class="session-time">{{ session.time }}</span>
          </div>
        </div>
      </div>

      <button class="see-all-btn" @click="openCalendar">
        Voir tout
        <q-icon name="add" />
      </button>
    </section>

    <!-- Suggestions -->
    <section class="section">
      <h2 class="section-title">
        <span class="title-bar"></span>
        Suggestions pour toi
      </h2>
      
      <div class="suggestions-scroll">
        <div 
          v-for="user in suggestedUsers" 
          :key="user.id"
          class="suggestion-card"
          :style="{ backgroundColor: user.bgColor }"
          @click="openUserChat(user)"
        >
          <div class="suggestion-avatar-container">
            <img :src="user.avatar" :alt="user.name" class="suggestion-avatar" />
          </div>
          <span class="suggestion-name">{{ user.name }}</span>
          <div class="suggestion-tags">
            <span 
              v-for="tag in user.tags" 
              :key="tag"
              class="tag"
              :style="{ backgroundColor: getTagColor(tag) }"
            >
              {{ tag }}
            </span>
          </div>
          <button class="chat-btn">
            <q-icon name="chat_bubble_outline" />
          </button>
        </div>
      </div>
    </section>

    <!-- Recommended Groups -->
    <section class="section">
      <h2 class="section-title">
        <span class="title-bar"></span>
        Groupes recommandés
      </h2>
      
      <div class="suggestions-scroll">
        <div 
          v-for="group in recommendedGroups" 
          :key="group.id"
          class="suggestion-card"
          :style="{ backgroundColor: group.bgColor }"
        >
          <div class="suggestion-avatar-container group-avatar">
            <img :src="group.avatar" :alt="group.name" class="suggestion-avatar" />
          </div>
          <span class="suggestion-name">{{ group.name }}</span>
          <div class="suggestion-tags">
            <span 
              v-for="tag in group.tags" 
              :key="tag"
              class="tag"
              :style="{ backgroundColor: getTagColor(tag) }"
            >
              {{ tag }}
            </span>
          </div>
          <button class="chat-btn">
            <q-icon name="chat_bubble_outline" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  background: linear-gradient(180deg, #F0F4FF 0%, #FFFFFF 100%);
  min-height: 100vh;
  padding-bottom: 100px;
}

/* Header */
.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: transparent;
}

.menu-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: var(--sc-text-primary);
}

.menu-btn .q-icon {
  font-size: 24px;
}

.greeting {
  font-size: 20px;
  font-weight: 600;
  color: var(--sc-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.wave {
  font-size: 24px;
}

.profile-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #E8E8E8;
}

/* Sections */
.section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--sc-text-primary);
  margin: 0 20px 16px;
}

.title-bar {
  width: 4px;
  height: 20px;
  background: var(--sc-primary-blue);
  border-radius: 2px;
}

/* Sessions */
.sessions-list {
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.session-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 16px;
  color: white;
}

.session-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-title {
  font-size: 16px;
  font-weight: 600;
}

.session-subject {
  display: inline-block;
  background: white;
  color: var(--sc-text-primary);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
}

.session-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.session-date,
.session-time {
  background: white;
  color: var(--sc-text-primary);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
}

.see-all-btn {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--sc-text-secondary);
  font-size: 14px;
  padding: 12px 20px;
  margin-left: auto;
}

.see-all-btn .q-icon {
  font-size: 20px;
  color: var(--sc-primary-blue);
}

/* Suggestions Scroll */
.suggestions-scroll {
  display: flex;
  gap: 16px;
  padding: 0 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.suggestions-scroll::-webkit-scrollbar {
  display: none;
}

.suggestion-card {
  flex-shrink: 0;
  width: 160px;
  padding: 20px 16px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  scroll-snap-align: start;
  cursor: pointer;
  transition: transform 0.2s;
}

.suggestion-card:hover {
  transform: scale(1.02);
}

.suggestion-avatar-container {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.suggestion-avatar-container.group-avatar {
  border-radius: 50%;
}

.suggestion-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.suggestion-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--sc-text-primary);
  text-align: center;
}

.suggestion-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: white;
}

.chat-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 2px solid var(--sc-primary-blue);
  background: white;
  color: var(--sc-primary-blue);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
}

.chat-btn .q-icon {
  font-size: 18px;
}

/* Desktop Responsive */
@media (min-width: 768px) {
  .home-page {
    max-width: 600px;
    margin: 0 auto;
    border-left: 1px solid #E8E8E8;
    border-right: 1px solid #E8E8E8;
  }
}

@media (min-width: 1024px) {
  .home-page {
    max-width: 700px;
  }
}
</style>

