// server/scripts/seedConversationParticipants.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import StudyGroup from '../models/StudyGroup.mjs';
import GroupMember from '../models/GroupMember.mjs';
import Conversation from '../models/Conversation.mjs';
import ConversationParticipant from '../models/ConversationParticipant.mjs';
import { fileURLToPath } from 'url';

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedConversationParticipants() {
  const users = await User.find();
  const conversations = await Conversation.find();

  if (users.length === 0 || conversations.length === 0) {
    console.log('❌ Users ou Conversations manquants — seeds requis avant.');
    return;
  }

  for (const conv of conversations) {
    let participants = [];

    if (conv.type === 'group') {
      // Ajouter tous les membres du groupe comme participants
      const members = await GroupMember.find({ group_id: conv.group_id });
      participants = members.map(m => m.user_id);
    } else if (conv.type === 'private') {
      // 2 utilisateurs aléatoires pour la conversation privée
      participants = [...users]
        .sort(() => 0.5 - Math.random())
        .slice(0, 2)
        .map(u => u._id);
    }

    for (const userId of participants) {
      const exists = await ConversationParticipant.findOne({
        conversation_id: conv._id,
        user_id: userId,
      });

      if (exists) {
        console.log(`Participant exists: ${userId} in conversation ${conv._id}`);
        continue;
      }

      await ConversationParticipant.create({
        conversation_id: conv._id,
        user_id: userId,
      });

      console.log(`Seeded participant ${userId} for conversation ${conv._id}`);
    }
  }
}

/**
 * Exécution standalone
 * node server/scripts/seedConversationParticipants.mjs
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedConversationParticipants();
      console.log('✅ seedConversationParticipants exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedConversationParticipants:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}