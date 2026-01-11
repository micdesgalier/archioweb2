// server/scripts/seedMessages.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import Conversation from '../models/Conversation.mjs';
import Message from '../models/Message.mjs';
import { fileURLToPath } from 'url';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function seedMessages() {
  const users = await User.find().lean();
  const conversations = await Conversation.find().lean();

  if (!users.length) {
    console.log('❌ Aucun utilisateur trouvé.');
    return;
  }
  if (!conversations.length) {
    console.log('❌ Aucune conversation trouvée.');
    return;
  }

  for (const conv of conversations) {
    const numMessages = getRandomInt(3, 6);

    if (conv.type === 'private') {
      const members = conv.members.map(m => m.toString());
      if (members.length < 2) continue;
      const [memberA, memberB] = members;

      for (let i = 0; i < numMessages; i++) {
        const senderId = i % 2 === 0 ? memberA : memberB;
        const receiverId = i % 2 === 0 ? memberB : memberA;

        await Message.create({
          sender_id: senderId,
          receiver_id: receiverId,
          conversation_id: conv._id,
          content: `Message privé #${i + 1} de conv ${conv._id}`,
          timestamp: new Date(Date.now() - getRandomInt(0, 1000 * 60 * 60 * 24)),
          read: Math.random() < 0.5,
        });
      }
      console.log(`✅ Seeded ${numMessages} messages privés pour conversation ${conv._id}`);
      continue;
    }

    if (conv.type === 'group') {
      // Pour les groupes, choisir un expéditeur et un destinataire parmi les membres
      const members = Array.isArray(conv.members) && conv.members.length > 0
        ? conv.members.map(m => m.toString())
        : users.map(u => u._id.toString());

      for (let i = 0; i < numMessages; i++) {
        const senderId = members[getRandomInt(0, members.length - 1)];
        let receiverId = senderId;
        while (receiverId === senderId) {
          receiverId = members[getRandomInt(0, members.length - 1)];
        }

        await Message.create({
          sender_id: senderId,
          receiver_id: receiverId,
          conversation_id: conv._id,
          content: `Message de groupe #${i + 1} de conv ${conv._id}`,
          timestamp: new Date(Date.now() - getRandomInt(0, 1000 * 60 * 60 * 24)),
          read: false,
        });
      }
      console.log(`✅ Seeded ${numMessages} messages pour conversation de groupe ${conv._id}`);
      continue;
    }

    console.log(`ℹ️ Conversation ${conv._id} ignorée (type inconnu: ${conv.type})`);
  }
}