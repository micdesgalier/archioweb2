// server/scripts/seedStudyGroups.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import Subject from '../models/Subject.mjs';
import City from '../models/City.mjs';
import StudyGroup from '../models/StudyGroup.mjs';

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

async function main() {
  await connectMongo(console);

  // Récupérer un utilisateur, une ville et un sujet pour lier aux groupes
  const users = await User.find().limit(3);
  const subjects = await Subject.find().limit(3);
  const cities = await City.find().limit(2); // pour les groupes présentiels

  for (let i = 0; i < groupsToSeed.length; i++) {
    const g = groupsToSeed[i];

    // Vérifier si un groupe avec le même titre existe déjà
    const exists = await StudyGroup.findOne({ title: g.title });
    if (!exists) {
      const group = new StudyGroup({
        ...g,
        creator_id: users[i % users.length]._id,
        subject_id: subjects[i % subjects.length]._id,
        city_id: g.is_online ? null : cities[i % cities.length]._id,
        start_time: new Date(Date.now() + i * 3600 * 1000), // maintenant + i heures
        end_time: new Date(Date.now() + (i * 3600 + 2) * 1000), // +2 sec pour l'exemple
      });

      await group.save();
      console.log('Seeded study group:', g.title);
    } else {
      console.log('Study group already exists:', g.title);
    }
  }

  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });