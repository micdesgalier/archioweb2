// server/scripts/seedUsers.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

const usersToSeed = [
  {
    first_name: 'Alice',
    last_name: 'Dupont',
    email: 'alice.dupont@example.com',
    password_hash: 'hashedpassword1',
    birth_date: new Date('1998-03-15'),
    study_year: 2,
    bio: 'Étudiante en informatique.',
    avatar_url: 'https://i.pravatar.cc/150?img=1',
  },
  {
    first_name: 'Bob',
    last_name: 'Martin',
    email: 'bob.martin@example.com',
    password_hash: 'hashedpassword2',
    birth_date: new Date('1997-07-22'),
    study_year: 3,
    bio: 'Passionné de mathématiques.',
    avatar_url: 'https://i.pravatar.cc/150?img=2',
  },
  {
    first_name: 'Caroline',
    last_name: 'Petit',
    email: 'caroline.petit@example.com',
    password_hash: 'hashedpassword3',
    birth_date: new Date('1999-01-05'),
    study_year: 1,
    bio: 'Amoureuse de la physique et de l’astronomie.',
    avatar_url: 'https://i.pravatar.cc/150?img=3',
  },
  {
    first_name: 'David',
    last_name: 'Lemoine',
    email: 'david.lemoine@example.com',
    password_hash: 'hashedpassword4',
    birth_date: new Date('2000-12-12'),
    study_year: 2,
    bio: 'Fan de biologie et écologie.',
    avatar_url: 'https://i.pravatar.cc/150?img=4',
  },
  {
    first_name: 'Émilie',
    last_name: 'Moreau',
    email: 'emilie.moreau@example.com',
    password_hash: 'hashedpassword5',
    birth_date: new Date('1998-09-30'),
    study_year: 4,
    bio: 'Étudiante en littérature française.',
    avatar_url: 'https://i.pravatar.cc/150?img=5',
  },
];

/**
 * Exporte la fonction de seed pour être appelée depuis seedAll.js
 * IMPORTANT : cette fonction n'ouvre / ne ferme PAS la connexion MongoDB.
 */
export async function seedUsers() {
  for (const u of usersToSeed) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      const user = new User(u);
      await user.save();
      console.log('Seeded user:', u.email);
    } else {
      console.log('User already exists:', u.email);
    }
  }
}

/**
 * Si on exécute ce fichier directement (node server/scripts/seedUsers.mjs),
 * on ouvre et ferme la connexion automatiquement.
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedUsers();
      console.log('✅ seedUsers exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedUsers (standalone):', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}