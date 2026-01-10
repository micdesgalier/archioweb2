// server/scripts/seedMessages.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import Conversation from '../models/Conversation.mjs';
import Message from '../models/Message.mjs';
import { fileURLToPath } from 'url';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomExcept(array, exceptId) {
  if (!Array.isArray(array) || array.length === 0) return null;
  const filtered = array.filter(u => u._id.toString() !== exceptId.toString());
  if (filtered.length === 0) return null;
  return filtered[getRandomInt(0, filtered.length - 1)];
}

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedMessages() {
  const users = await User.find().lean();
  const conversations = await Conversation.find().lean();

  if (!users || users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé — seedUsers requis avant seedMessages.');
    return;
  }
  if (!conversations || conversations.length === 0) {
    console.log('❌ Aucune conversation trouvée — seedConversations requis avant seedMessages.');
    return;
  }

  for (const conv of conversations) {
    const numMessages = getRandomInt(3, 6);

    for (let i = 0; i < numMessages; i++) {
      // Choisir un expéditeur aléatoire
      const sender = users[getRandomInt(0, users.length - 1)];
      if (!sender) continue;

      // Choisir un destinataire différent
      let receiver = null;

      if (conv.type === 'private') {
        // pour private, choisir un autre utilisateur aléatoire
        receiver = pickRandomExcept(users, sender._id);
        if (!receiver) {
          // si pas trouvé (rare), sauter
          console.log('Aucun destinataire disponible pour private conv, skip.');
          continue;
        }
      } else {
        // pour group, on choisit un utilisateur différent aussi
        // (on ne lie pas receiver à un groupe dans le schéma -> receiver doit être un User)
        receiver = pickRandomExcept(users, sender._id);
        if (!receiver) {
          console.log('Aucun destinataire disponible pour group conv, skip.');
          continue;
        }
      }

      const content = `Message de test ${i + 1} dans conversation ${conv._id}`;

      // Eviter doublons exacts
      const exists = await Message.findOne({
        conversation_id: conv._id,
        sender_id: sender._id,
        receiver_id: receiver._id,
        content,
      });

      if (exists) {
        console.log(`Message exists: conv=${conv._id} sender=${sender.email}`);
        continue;
      }

      // Créer le message
      await Message.create({
        sender_id: sender._id,
        receiver_id: receiver._id,
        conversation_id: conv._id,
        content,
        timestamp: new Date(Date.now() - getRandomInt(0, 1000 * 60 * 60 * 24)), // date aléatoire dans les dernières 24h
        read: Math.random() < 0.5,
      });

      console.log(`Seeded message: conv=${conv._id} sender=${sender.email} -> receiver=${receiver.email}`);
    }
  }
}

/**
 * Exécution standalone
 * node server/scripts/seedMessages.mjs
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedMessages();
      console.log('✅ seedMessages exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedMessages:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}