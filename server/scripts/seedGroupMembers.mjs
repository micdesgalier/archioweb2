// server/scripts/seedGroupMembers.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import StudyGroup from '../models/StudyGroup.mjs';
import GroupMember from '../models/GroupMember.mjs';
import { fileURLToPath } from 'url';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedGroupMembers() {
  const users = await User.find();
  const groups = await StudyGroup.find();

  if (users.length === 0 || groups.length === 0) {
    console.log('❌ Users ou StudyGroups manquants — seeds requis avant.');
    return;
  }

  for (const group of groups) {
    // 3 à 5 membres aléatoires
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffledUsers.slice(0, getRandomInt(3, 5));

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];

      const exists = await GroupMember.findOne({
        group_id: group._id,
        user_id: user._id,
      });

      if (exists) {
        console.log(`Group member exists: ${user.email} in group ${group.title}`);
        continue;
      }

      await GroupMember.create({
        group_id: group._id,
        user_id: user._id,
        role: i === 0 ? 'admin' : 'member', // premier = admin
        status: 'joined',
        joined_at: new Date(Date.now() - getRandomInt(0, 7) * 24 * 3600 * 1000),
      });

      console.log(`Seeded group member: ${user.email} in group ${group.title} (${i === 0 ? 'admin' : 'member'})`);
    }
  }
}

/**
 * Exécution standalone
 * node server/scripts/seedGroupMembers.mjs
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedGroupMembers();
      console.log('✅ seedGroupMembers exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedGroupMembers:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}