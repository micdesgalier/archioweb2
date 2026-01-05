// server/scripts/seedMessages.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import Conversation from '../models/Conversation.mjs';
import Message from '../models/Message.mjs';
import { fileURLToPath } from 'url';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedMessages() {
  const users = await User.find();
  const conversations = await Conversation.find();

  if (users.length === 0 || conversations.length === 0) {
    console.log('❌ Users ou Conversations manquants — seed requis avant.');
    return;
  }

  for (const conv of conversations) {
    const numMessages = getRandomInt(3, 5);

    for (let i = 0; i < numMessages; i++) {
      const sender = users[getRandomInt(0, users.length - 1)];

      const content = `Message de test ${i + 1} dans conversation ${conv._id}`;

      const exists = await Message.findOne({
        conversation_id: conv._id,
        sender_id: sender._id,
        content,
      });

      if (exists) {
        console.log(`Message exists: conv=${conv._id} sender=${sender.email}`);
        continue;
      }

      await Message.create({
        conversation_id: conv._id,
        sender_id: sender._id,
        content,
        message_type: 'text',
      });

      console.log(`Seeded message: conv=${conv._id} sender=${sender.email}`);
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