// server/scripts/seedUserSubjectProfiles.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import Subject from '../models/Subject.mjs';
import UserSubjectProfile from '../models/UserSubjectProfile.mjs';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  await connectMongo(console);

  const users = await User.find();
  const subjects = await Subject.find();
  if (users.length === 0 || subjects.length === 0) {
    console.log('❌ Assure-toi d’avoir déjà seedé les utilisateurs et les matières.');
    process.exit(0);
  }

  for (const user of users) {
    // Sélectionne 2 à 3 matières aléatoires par utilisateur
    const shuffledSubjects = subjects.sort(() => 0.5 - Math.random());
    const selectedSubjects = shuffledSubjects.slice(0, getRandomInt(2, 3));

    for (const subject of selectedSubjects) {
      // Vérifier si le profil existe déjà
      const exists = await UserSubjectProfile.findOne({
        user_id: user._id,
        subject_id: subject._id,
      });

      if (!exists) {
        // Choisir can_help et needs_help aléatoirement mais pas les deux vrais
        const can_help = Math.random() < 0.5;
        const needs_help = !can_help && Math.random() < 0.5;

        const profile = new UserSubjectProfile({
          user_id: user._id,
          subject_id: subject._id,
          can_help,
          needs_help,
          level: getRandomInt(1, 5),
          comment: 'Profil de test généré automatiquement',
        });

        await profile.save();
        console.log(`Seeded user-subject profile: ${user.email} / ${subject.name}`);
      } else {
        console.log(`Profile already exists: ${user.email} / ${subject.name}`);
      }
    }
  }

  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });