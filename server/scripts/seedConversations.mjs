// server/scripts/seedConversations.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import StudyGroup from '../models/StudyGroup.mjs';
import Conversation from '../models/Conversation.mjs';
import { fileURLToPath } from 'url';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedConversations() {
  const users = await User.find();
  const studyGroups = await StudyGroup.find();

  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé — seedUsers requis avant.');
    return;
  }

  /** ------------------------------
   * 1️⃣ Conversations de groupe
   * ------------------------------ */
  for (const group of studyGroups) {
    const exists = await Conversation.findOne({ type: 'group', group_id: group._id });
    if (exists) {
      console.log('Group conversation exists for study group:', group.title);
      continue;
    }

    await Conversation.create({
      type: 'group',
      group_id: group._id,
    });

    console.log('Seeded group conversation for study group:', group.title);
  }

  /** ------------------------------
   * 2️⃣ Conversations privées : 2 par utilisateur
   * ------------------------------ */
  for (const user of users) {
    for (let i = 0; i < 2; i++) {
      let otherUser;
      do {
        otherUser = users[getRandomInt(0, users.length - 1)];
      } while (otherUser._id.equals(user._id));

      // Comme le modèle n'a pas user1/user2, on crée simplement une conversation "private"
      await Conversation.create({
        type: 'private',
      });

      console.log(`Seeded private conversation for user: ${user.email}`);
    }
  }
}

/**
 * Exécution standalone
 * node server/scripts/seedConversations.mjs
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedConversations();
      console.log('✅ seedConversations exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedConversations:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}