// server/scripts/seedCities.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import City from '../models/City.mjs';
import User from '../models/User.mjs';
import { fileURLToPath } from 'url';

const citiesToSeed = [
  { name: 'Lausanne', country: 'Suisse', postal_code: '1000' },
  { name: 'Yverdon-les-Bains', country: 'Suisse', postal_code: '1400' },
  { name: 'Bussigny', country: 'Suisse', postal_code: '1030' },
  { name: 'Montreux', country: 'Suisse', postal_code: '1820' },
  { name: 'Neuchâtel', country: 'Suisse', postal_code: '2000' },
  { name: 'Vevey', country: 'Suisse', postal_code: '1800' },
];

// Assign cities to existing users
const userCityAssignments = {
  'alice.dupont@example.com': 'Lausanne',
  'bob.martin@example.com': 'Yverdon-les-Bains',
  'caroline.petit@example.com': 'Montreux',
  'david.lemoine@example.com': 'Neuchâtel',
  'emilie.moreau@example.com': 'Vevey',
};

export async function seedCities() {
  const cityMap = {};
  
  // Create cities
  for (const c of citiesToSeed) {
    let city = await City.findOne({ name: c.name, postal_code: c.postal_code });
    if (!city) {
      city = new City(c);
      await city.save();
      console.log('Seeded city:', c.name);
    } else {
      console.log('City already exists:', c.name);
    }
    cityMap[c.name] = city._id;
  }
  
  // Assign cities to users
  for (const [email, cityName] of Object.entries(userCityAssignments)) {
    const cityId = cityMap[cityName];
    if (cityId) {
      const result = await User.updateOne(
        { email },
        { $set: { city_id: cityId } }
      );
      if (result.modifiedCount > 0) {
        console.log(`Assigned ${cityName} to ${email}`);
      } else {
        console.log(`User ${email} not found or already has city`);
      }
    }
  }
  
  return cityMap;
}

// Standalone execution
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedCities();
      console.log('✅ seedCities exécuté');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedCities:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}
