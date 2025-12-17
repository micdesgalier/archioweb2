// server/scripts/seedGroupMembers.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import StudyGroup from '../models/StudyGroup.mjs';
import GroupMember from '../models/GroupMember.mjs';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  await connectMongo(console);

  const users = await User.find();
  const groups = await StudyGroup.find();
  if (users.length === 0 || groups.length === 0) {
    console.log('❌ Assure-toi que les utilisateurs et les groupes sont déjà seedés.');
    process.exit(0);
  }

  for (const group of groups) {
    // Sélectionner 3 à 5 membres aléatoires par groupe
    const shuffledUsers = users.sort(() => 0.5 - Math.random());
    const selectedUsers = shuffledUsers.slice(0, getRandomInt(3, 5));

    // Au moins un admin : le premier utilisateur sélectionné
    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];

      const exists = await GroupMember.findOne({
        group_id: group._id,
        user_id: user._id,
      });

      if (!exists) {
        const member = new GroupMember({
          group_id: group._id,
          user_id: user._id,
          role: i === 0 ? 'admin' : 'member', // premier = admin
          status: 'joined',
          joined_at: new Date(Date.now() - getRandomInt(0, 7) * 24 * 3600 * 1000), // rejoint aléatoirement dans la semaine
        });

        await member.save();
        console.log(`Seeded group member: ${user.email} in group ${group.title} (${member.role})`);
      } else {
        console.log(`Group member already exists: ${user.email} in group ${group.title}`);
      }
    }
  }

  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });