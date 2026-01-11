<script setup>
import { ref, computed, onMounted } from 'vue';
import { currentUsername, allUsers, loadAllUsers } from '@/store/chat.js';
import avatarAlice from '@/assets/Alice.png';
import avatarAliceAnalyse from '@/assets/aliceanalyse.png';
import avatarBob from '@/assets/bob.png';
import avatarCaroline from '@/assets/caroline.png';
import avatarDavid from '@/assets/david.png';
import avatarEmilie from '@/assets/emilie.png';
import avatarGroupeHeigVd from '@/assets/groupeheigvd.png';
import avatarLausanneMath from '@/assets/groupelausannemath.png';
import avatarGroupeEpfl from '@/assets/groupeepfl.png';

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

// Single background color for all individual user cards
const userCardBgColor = '#DBEAFE'; // Light blue for all users

// Background colors for group cards (different colors)
const groupBgColors = ['#FEF3C7', '#D1FAE5', '#FEE2E2', '#E0E7FF', '#FCE7F3'];

// Suggested users based on their subject profiles
const suggestedUsers = computed(() => {
  return allUsers.value.slice(0, 8).map((user, index) => {
    // Get ONE subject where canHelp=true and ONE where needsHelp=true
    const tags = [];
    
    if (user.subjects && user.subjects.length > 0) {
      // Find first subject where user can help (green)
      const canHelpSubject = user.subjects.find(s => s.canHelp);
      if (canHelpSubject) {
        tags.push({
          name: canHelpSubject.subject,
          canHelp: true,
          needsHelp: false
        });
      }
      
      // Find first subject where user needs help (yellow)
      const needsHelpSubject = user.subjects.find(s => s.needsHelp);
      if (needsHelpSubject) {
        tags.push({
          name: needsHelpSubject.subject,
          canHelp: false,
          needsHelp: true
        });
      }
    }

    // Use special images for specific users in suggestions
    let avatarUrl = user.avatar_url || `https://i.pravatar.cc/100?u=${user._id || user.id}`;
    const firstName = user.first_name?.toLowerCase();
    
    if (user.first_name === 'Alice' || user.email === 'alice.dupont@example.com') {
      avatarUrl = avatarAliceAnalyse;
    } else if (firstName === 'bob') {
      avatarUrl = avatarBob;
    } else if (firstName === 'caroline') {
      avatarUrl = avatarCaroline;
    } else if (firstName === 'david') {
      avatarUrl = avatarDavid;
    } else if (firstName === 'émilie' || firstName === 'emilie') {
      avatarUrl = avatarEmilie;
    }
    
    const isAlice = user.first_name === 'Alice' || user.email === 'alice.dupont@example.com';
    const isBobOrCaroline = firstName === 'bob' || firstName === 'caroline';
    
    return {
      id: user._id || user.id,
      name: user.first_name,
      fullName: `${user.first_name} ${user.last_name}`,
      avatar: avatarUrl,
      tags: tags,
      bgColor: userCardBgColor, // Same color for all users
      isAlice: isAlice, // Flag to add specific class for Alice
      isBobOrCaroline: isBobOrCaroline // Flag for Bob and Caroline (moderate zoom)
    };
  });
});

// Demo groups (with different background colors)
const recommendedGroups = ref([
  {
    id: 'g1',
    name: 'Groupe HEIG-VD',
    avatar: avatarGroupeHeigVd,
    tags: [
      { name: 'programmation', isGroup: true }
    ],
    bgColor: groupBgColors[0]
  },
  {
    id: 'g2',
    name: 'Lausanne - Math',
    avatar: avatarLausanneMath,
    tags: [
      { name: 'maths', isGroup: true }
    ],
    bgColor: groupBgColors[1]
  },
  {
    id: 'g3',
    name: 'EPFL - Prog',
    avatar: avatarGroupeEpfl,
    tags: [
      { name: 'prog', isGroup: true }
    ],
    bgColor: groupBgColors[2]
  }
]);

// Tag color: green for canHelp, yellow for needsHelp, blue for groups
function getTagColor(tag) {
  if (tag.isGroup) return '#3B82F6'; // Blue for groups
  if (tag.canHelp) return '#22C55E'; // Green
  if (tag.needsHelp) return '#FBBF24'; // Yellow/Orange
  return '#6B7280'; // Gray default
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
      <h1 class="greeting">
        <span class="wave">👋</span> Hello {{ currentUsername || 'User' }}
      </h1>
      <button class="profile-btn" @click="$emit('open-profile')">
        <img :src="avatarAlice" alt="Profile" class="profile-avatar" />
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
        Voir le calendrier
        <q-icon name="calendar_month" />
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
            <img :src="user.avatar" :alt="user.name" :class="['suggestion-avatar', { 'alice-avatar-img': user.isAlice, 'bob-caroline-avatar-img': user.isBobOrCaroline }]" />
          </div>
          <span class="suggestion-name">{{ user.name }}</span>
          <div class="suggestion-tags">
            <span 
              v-for="(tag, idx) in user.tags.slice(0, 2)" 
              :key="idx"
              class="tag"
              :style="{ backgroundColor: getTagColor(tag) }"
            >
              {{ tag.name }}
            </span>
            <span v-if="user.tags.length === 0" class="no-tags">Nouveau</span>
          </div>
          <button class="chat-btn" @click.stop="openUserChat(user)">
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
              v-for="(tag, idx) in group.tags" 
              :key="idx"
              class="tag"
              :style="{ backgroundColor: getTagColor(tag) }"
            >
              {{ tag.name }}
            </span>
          </div>
          <button class="chat-btn">
            <q-icon name="chat_bubble_outline" />
          </button>
        </div>
      </div>
    </section>

    <!-- Color Legend -->
    <div class="color-legend">
      <div class="legend-item">
        <span class="legend-dot" style="background: #22C55E;"></span>
        <span>Peut aider</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #FBBF24;"></span>
        <span>A besoin d'aide</span>
      </div>
    </div>
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
  overflow: hidden;
}

.suggestion-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.suggestion-avatar.group-avatar-img {
  transform: scale(1.15);
  object-position: center;
}

.suggestion-avatar.alice-avatar-img {
  transform: scale(1.3);
  object-position: center;
}

.suggestion-avatar.bob-caroline-avatar-img {
  transform: scale(1.15);
  object-position: center;
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
  min-height: 50px;
  align-items: flex-start;
  align-content: flex-start;
}

.tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: white;
}

.no-tags {
  font-size: 12px;
  color: var(--sc-text-secondary);
  font-style: italic;
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

/* Color Legend */
.color-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 16px 20px;
  margin-top: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--sc-text-secondary);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
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