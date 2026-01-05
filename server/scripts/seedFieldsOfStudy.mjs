// server/scripts/seedFieldsOfStudy.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import FieldOfStudy from '../models/FieldOfStudy.mjs';
import { fileURLToPath } from 'url';

const fieldsToSeed = [
  { name: 'Informatique' },
  { name: 'Mathématiques' },
  { name: 'Physique' },
  { name: 'Biologie' },
  { name: 'Littérature Française' },
];

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedFieldsOfStudy() {
  for (const f of fieldsToSeed) {
    const exists = await FieldOfStudy.findOne({ name: f.name });

    if (exists) {
      console.log('Field of study exists:', f.name);
      continue;
    }

    await FieldOfStudy.create(f);
    console.log('Seeded field of study:', f.name);
  }
}

/**
 * Exécution standalone
 * node server/scripts/seedFieldsOfStudy.mjs
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedFieldsOfStudy();
      console.log('✅ seedFieldsOfStudy exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedFieldsOfStudy:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}