// server/scripts/seedFieldsOfStudy.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import FieldOfStudy from '../models/FieldOfStudy.mjs';

const fieldsToSeed = [
  { name: 'Informatique' },
  { name: 'Mathématiques' },
  { name: 'Physique' },
  { name: 'Biologie' },
  { name: 'Littérature Française' },
];

async function main() {
  await connectMongo(console);
  for (const f of fieldsToSeed) {
    const exists = await FieldOfStudy.findOne({ name: f.name });
    if (!exists) {
      const field = new FieldOfStudy(f);
      await field.save();
      console.log('Seeded field of study:', f.name);
    } else {
      console.log('Field of study already exists:', f.name);
    }
  }
  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });