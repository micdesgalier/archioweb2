// server/scripts/seedConversations.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import StudyGroup from '../models/StudyGroup.mjs';
import Conversation from '../models/Conversation.mjs';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  await connectMongo(console);

  const users = await User.find();
  const studyGroups = await StudyGroup.find();
  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé. Exécute d’abord le seed des utilisateurs.');
    process.exit(0);
  }

  // 1️⃣ Conversations de groupe pour chaque study group
  for (const group of studyGroups) {
    const exists = await Conversation.findOne({ type: 'group', group_id: group._id });
    if (!exists) {
      const conv = new Conversation({
        type: 'group',
        group_id: group._id,
      });
      await conv.save();
      console.log('Seeded group conversation for study group:', group.title);
    } else {
      console.log('Group conversation already exists for study group:', group.title);
    }
  }

  // 2️⃣ Conversations privées : 2 par utilisateur
  for (const user of users) {
    for (let i = 0; i < 2; i++) {
      // Choisir un autre utilisateur aléatoire
      let otherUser;
      do {
        otherUser = users[getRandomInt(0, users.length - 1)];
      } while (otherUser._id.equals(user._id));

      // Vérifier si conversation privée entre ces deux existe déjà (bidirectionnel)
      const exists = await Conversation.findOne({
        type: 'private',
        $or: [
          { user1: user._id, user2: otherUser._id },
          { user1: otherUser._id, user2: user._id }
        ]
      });

      // Comme le modèle n'a pas user1/user2, on crée simplement une conversation "private" par utilisateur
      const conv = new Conversation({
        type: 'private',
      });
      await conv.save();
      console.log(`Seeded private conversation for user: ${user.email}`);
    }
  }

  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });