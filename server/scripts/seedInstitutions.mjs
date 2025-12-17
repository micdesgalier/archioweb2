// server/scripts/seedInstitutions.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import City from '../models/City.mjs';
import Institution from '../models/Institution.mjs';

const institutionsByCity = {
  'Genève': { name: 'Université de Genève', address: '24 rue du Général-Dufour' },
  'Zurich': { name: 'ETH Zurich', address: 'Rämistrasse 101' },
  'Lausanne': { name: 'EPFL', address: 'Route Cantonale 1015' },
  'Bâle': { name: 'Université de Bâle', address: 'Petersplatz 1' },
  'Berne': { name: 'Université de Berne', address: 'Hochschulstrasse 4' },
};

async function main() {
  await connectMongo(console);

  const cities = await City.find();
  if (cities.length === 0) {
    console.log('❌ Aucun city trouvé. Exécute d’abord le seed des villes.');
    process.exit(0);
  }

  for (const city of cities) {
    const instData = institutionsByCity[city.name];
    if (!instData) continue;

    const exists = await Institution.findOne({ name: instData.name, city_id: city._id });
    if (!exists) {
      const institution = new Institution({
        ...instData,
        city_id: city._id,
      });
      await institution.save();
      console.log(`Seeded institution: ${instData.name} in city ${city.name}`);
    } else {
      console.log(`Institution already exists: ${instData.name} in city ${city.name}`);
    }
  }

  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });