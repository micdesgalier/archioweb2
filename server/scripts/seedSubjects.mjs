// server/scripts/seedSubjects.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import FieldOfStudy from '../models/FieldOfStudy.mjs';
import Subject from '../models/Subject.mjs';
import { fileURLToPath } from 'url';

const subjectsByField = {
  Informatique: [
    { name: 'Algorithmique', code: 'CS-101', level: 'Bachelor' },
    { name: 'Structures de données', code: 'CS-102', level: 'Bachelor' },
    { name: 'Systèmes d’exploitation', code: 'CS-103', level: 'Bachelor' },
  ],
  Mathématiques: [
    { name: 'Analyse', code: 'MATH-101', level: 'Bachelor' },
    { name: 'Algèbre linéaire', code: 'MATH-102', level: 'Bachelor' },
    { name: 'Probabilités', code: 'MATH-103', level: 'Bachelor' },
  ],
  Physique: [
    { name: 'Mécanique', code: 'PHYS-101', level: 'Bachelor' },
    { name: 'Électromagnétisme', code: 'PHYS-102', level: 'Bachelor' },
    { name: 'Thermodynamique', code: 'PHYS-103', level: 'Bachelor' },
  ],
  Biologie: [
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

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedSubjects() {
  const fields = await FieldOfStudy.find();

  if (fields.length === 0) {
    console.log('❌ Aucun field trouvé — seedFieldOfStudy requis avant.');
    return;
  }

  for (const field of fields) {
    const subjects = subjectsByField[field.name] || [];

    for (const s of subjects) {
      const exists = await Subject.findOne({ code: s.code });

      if (!exists) {
        await Subject.create({
          ...s,
          field_id: field._id,
        });
        console.log(`Seeded subject: ${s.name} (${field.name})`);
      } else {
        console.log(`Subject exists: ${s.name} (${field.name})`);
      }
    }
  }
}

/**
 * Exécution standalone
 * node server/scripts/seedSubjects.mjs
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedSubjects();
      console.log('✅ seedSubjects exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedSubjects:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}