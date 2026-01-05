// server/scripts/seedInstitutions.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import City from '../models/City.mjs';
import Institution from '../models/Institution.mjs';
import { fileURLToPath } from 'url';

const institutionsByCity = {
  Genève: { name: 'Université de Genève', address: '24 rue du Général-Dufour' },
  Zurich: { name: 'ETH Zurich', address: 'Rämistrasse 101' },
  Lausanne: { name: 'EPFL', address: 'Route Cantonale 1015' },
  Bâle: { name: 'Université de Bâle', address: 'Petersplatz 1' },
  Berne: { name: 'Université de Berne', address: 'Hochschulstrasse 4' },
};

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedInstitutions() {
  const cities = await City.find();

  if (cities.length === 0) {
    console.log('❌ Aucun city trouvé — seedCities requis avant.');
    return;
  }

  for (const city of cities) {
    const instData = institutionsByCity[city.name];
    if (!instData) continue;

    const exists = await Institution.findOne({
      name: instData.name,
      city_id: city._id,
    });

    if (exists) {
      console.log(`Institution exists: ${instData.name} in city ${city.name}`);
      continue;
    }

    await Institution.create({
      ...instData,
      city_id: city._id,
    });

    console.log(`Seeded institution: ${instData.name} in city ${city.name}`);
  }
}

/**
 * Exécution standalone
 * node server/scripts/seedInstitutions.mjs
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedInstitutions();
      console.log('✅ seedInstitutions exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedInstitutions:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}