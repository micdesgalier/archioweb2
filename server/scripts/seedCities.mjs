// server/scripts/seedCities.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import City from '../models/City.mjs';

const citiesToSeed = [
  { name: 'Genève', country: 'Suisse', postal_code: '1200' },
  { name: 'Zurich', country: 'Suisse', postal_code: '8000' },
  { name: 'Lausanne', country: 'Suisse', postal_code: '1000' },
  { name: 'Bâle', country: 'Suisse', postal_code: '4000' },
  { name: 'Berne', country: 'Suisse', postal_code: '3000' },
];

async function main() {
  await connectMongo(console);
  for (const c of citiesToSeed) {
    const exists = await City.findOne({ name: c.name, postal_code: c.postal_code });
    if (!exists) {
      const city = new City(c);
      await city.save();
      console.log('Seeded city:', c.name);
    } else {
      console.log('City already exists:', c.name);
    }
  }
  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });