// server/scripts/seedSubjects.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import FieldOfStudy from '../models/FieldOfStudy.mjs';
import Subject from '../models/Subject.mjs';

const subjectsByField = {
  'Informatique': [
    { name: 'Algorithmique', code: 'CS-101', level: 'Bachelor' },
    { name: 'Structures de données', code: 'CS-102', level: 'Bachelor' },
    { name: 'Systèmes d’exploitation', code: 'CS-103', level: 'Bachelor' },
  ],
  'Mathématiques': [
    { name: 'Analyse', code: 'MATH-101', level: 'Bachelor' },
    { name: 'Algèbre linéaire', code: 'MATH-102', level: 'Bachelor' },
    { name: 'Probabilités', code: 'MATH-103', level: 'Bachelor' },
  ],
  'Physique': [
    { name: 'Mécanique', code: 'PHYS-101', level: 'Bachelor' },
    { name: 'Électromagnétisme', code: 'PHYS-102', level: 'Bachelor' },
    { name: 'Thermodynamique', code: 'PHYS-103', level: 'Bachelor' },
  ],
  'Biologie': [
    { name: 'Biologie cellulaire', code: 'BIO-101', level: 'Bachelor' },
    { name: 'Génétique', code: 'BIO-102', level: 'Bachelor' },
    { name: 'Écologie', code: 'BIO-103', level: 'Bachelor' },
  ],
  'Littérature Française': [
    { name: 'Poésie', code: 'LIT-101', level: 'Bachelor' },
    { name: 'Roman', code: 'LIT-102', level: 'Bachelor' },
    { name: 'Théâtre', code: 'LIT-103', level: 'Bachelor' },
  ],
};

async function main() {
  await connectMongo(console);

  const fields = await FieldOfStudy.find();
  for (const field of fields) {
    const subjects = subjectsByField[field.name] || [];
    for (const s of subjects) {
      const exists = await Subject.findOne({ code: s.code });
      if (!exists) {
        const subject = new Subject({ ...s, field_id: field._id });
        await subject.save();
        console.log(`Seeded subject: ${s.name} (${field.name})`);
      } else {
        console.log(`Subject already exists: ${s.name} (${field.name})`);
      }
    }
  }

  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });