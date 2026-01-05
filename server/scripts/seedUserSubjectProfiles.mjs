// server/scripts/seedUserSubjectProfiles.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import Subject from '../models/Subject.mjs';
import UserSubjectProfile from '../models/UserSubjectProfile.mjs';
import { fileURLToPath } from 'url';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedUserSubjectProfiles() {
  const users = await User.find();
  const subjects = await Subject.find();

  if (users.length === 0 || subjects.length === 0) {
    console.log('❌ Utilisateurs ou matières manquants — seed requis avant.');
    return;
  }

  for (const user of users) {
    // 2 à 3 matières aléatoires par utilisateur
    const shuffledSubjects = [...subjects].sort(() => 0.5 - Math.random());
    const selectedSubjects = shuffledSubjects.slice(0, getRandomInt(2, 3));

    for (const subject of selectedSubjects) {
      const exists = await UserSubjectProfile.findOne({
        user_id: user._id,
        subject_id: subject._id,
      });

      if (!exists) {
        // can_help et needs_help ne peuvent pas être vrais en même temps
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
        console.log(`Seeded profile: ${user.email} / ${subject.name}`);
      } else {
        console.log(`Profile exists: ${user.email} / ${subject.name}`);
      }
    }
  }
}

/**
 * Exécution standalone (node seedUserSubjectProfiles.mjs)
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedUserSubjectProfiles();
      console.log('✅ seedUserSubjectProfiles exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedUserSubjectProfiles:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}