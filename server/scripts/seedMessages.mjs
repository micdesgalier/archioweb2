// server/scripts/seedMessages.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import Conversation from '../models/Conversation.mjs';
import Message from '../models/Message.mjs';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  await connectMongo(console);

  const users = await User.find();
  const conversations = await Conversation.find();
  if (users.length === 0 || conversations.length === 0) {
    console.log('❌ Assure-toi que les utilisateurs et conversations sont déjà seedés.');
    process.exit(0);
  }

  for (const conv of conversations) {
    const numMessages = getRandomInt(3, 5);

    for (let i = 0; i < numMessages; i++) {
      const sender = users[getRandomInt(0, users.length - 1)];

      const messageData = {
        conversation_id: conv._id,
        sender_id: sender._id,
        content: `Message de test ${i + 1} dans conversation ${conv.id}`,
        message_type: 'text',
      };

      // Vérifier si un message similaire existe
      const exists = await Message.findOne({
        conversation_id: conv._id,
        sender_id: sender._id,
        content: messageData.content,
      });

      if (!exists) {
        const message = new Message(messageData);
        await message.save();
        console.log(`Seeded message in conversation ${conv.id} from ${sender.email}`);
      } else {
        console.log(`Message already exists in conversation ${conv.id} from ${sender.email}`);
      }
    }
  }

  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });