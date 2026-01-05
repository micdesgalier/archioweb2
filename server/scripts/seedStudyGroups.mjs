// server/scripts/seedStudyGroups.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import Subject from '../models/Subject.mjs';
import City from '../models/City.mjs';
import StudyGroup from '../models/StudyGroup.mjs';
import { fileURLToPath } from 'url';

const groupsToSeed = [
  {
    title: 'Révisions Mathématiques L1',
    description: 'Groupe pour réviser les cours de mathématiques du Bachelor 1.',
    is_online: false,
    location_detail: 'Bibliothèque UniMail, étage 2',
    max_members: 10,
  },
  {
    title: 'Algorithmique avancée',
    description: 'Session en ligne pour pratiquer les algorithmes complexes.',
    is_online: true,
    max_members: 5,
  },
  {
    title: 'Physique - Mécanique',
    description: 'Groupe présentiel pour exercices de mécanique',
    is_online: false,
    location_detail: 'Campus central, salle 101',
    max_members: 8,
  },
];

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedStudyGroups() {
  // Données nécessaires
  const users = await User.find().limit(3);
  const subjects = await Subject.find().limit(3);
  const cities = await City.find().limit(2);

  if (users.length === 0 || subjects.length === 0) {
    console.log('❌ Users ou Subjects manquants — seed requis avant.');
    return;
  }

  for (let i = 0; i < groupsToSeed.length; i++) {
    const g = groupsToSeed[i];

    const exists = await StudyGroup.findOne({ title: g.title });
    if (exists) {
      console.log('Study group exists:', g.title);
      continue;
    }

    const now = Date.now();

    await StudyGroup.create({
      ...g,
      creator_id: users[i % users.length]._id,
      subject_id: subjects[i % subjects.length]._id,
      city_id: g.is_online
        ? null
        : cities[i % cities.length]?._id ?? null,
      start_time: new Date(now + i * 3600 * 1000),
      end_time: new Date(now + (i * 3600 + 2) * 1000),
    });

    console.log('Seeded study group:', g.title);
  }
}

/**
 * Exécution standalone
 * node server/scripts/seedStudyGroups.mjs
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedStudyGroups();
      console.log('✅ seedStudyGroups exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedStudyGroups:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}