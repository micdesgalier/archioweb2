// server/scripts/seedCities.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import City from '../models/City.mjs';
import { fileURLToPath } from 'url';

const citiesToSeed = [
  { name: 'Genève', country: 'Suisse', postal_code: '1200' },
  { name: 'Zurich', country: 'Suisse', postal_code: '8000' },
  { name: 'Lausanne', country: 'Suisse', postal_code: '1000' },
  { name: 'Bâle', country: 'Suisse', postal_code: '4000' },
  { name: 'Berne', country: 'Suisse', postal_code: '3000' },
];

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedCities() {
  for (const c of citiesToSeed) {
    const exists = await City.findOne({ name: c.name, postal_code: c.postal_code });

    if (exists) {
      console.log('City exists:', c.name);
      continue;
    }

    await City.create(c);
    console.log('Seeded city:', c.name);
  }
}

/**
 * Exécution standalone
 * node server/scripts/seedCities.mjs
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedCities();
      console.log('✅ seedCities exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedCities:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}