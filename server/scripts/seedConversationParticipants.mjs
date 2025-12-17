// server/scripts/seedConversationParticipants.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import StudyGroup from '../models/StudyGroup.mjs';
import GroupMember from '../models/GroupMember.mjs';
import Conversation from '../models/Conversation.mjs';
import ConversationParticipant from '../models/ConversationParticipant.mjs';

async function main() {
  await connectMongo(console);

  const users = await User.find();
  const groups = await StudyGroup.find();
  const conversations = await Conversation.find();
  if (users.length === 0 || conversations.length === 0) {
    console.log('❌ Assure-toi que les utilisateurs et conversations sont déjà seedés.');
    process.exit(0);
  }

  for (const conv of conversations) {
    let participants = [];

    if (conv.type === 'group') {
      // Ajouter tous les membres du groupe comme participants
      const members = await GroupMember.find({ group_id: conv.group_id });
      participants = members.map(m => m.user_id);
    } else if (conv.type === 'private') {
      // Pour les conversations privées, prendre deux utilisateurs aléatoires
      participants = users.sort(() => 0.5 - Math.random()).slice(0, 2).map(u => u._id);
    }

    for (const userId of participants) {
      const exists = await ConversationParticipant.findOne({
        conversation_id: conv._id,
        user_id: userId,
      });

      if (!exists) {
        const participant = new ConversationParticipant({
          conversation_id: conv._id,
          user_id: userId,
        });
        await participant.save();
        console.log(`Seeded participant ${userId} for conversation ${conv.id}`);
      } else {
        console.log(`Participant ${userId} already exists in conversation ${conv.id}`);
      }
    }
  }

  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });