// server/scripts/seedAll.mjs

// 🔥 IMPORTANT : Charger dotenv EN PREMIER avant tous les imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Charge le .env depuis la racine du dossier server
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Maintenant on peut importer le reste
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import { seedCities } from './seedCities.mjs';
import { seedInstitutions } from './seedInstitutions.mjs';
import { seedFieldsOfStudy } from './seedFieldsOfStudy.mjs';
import { seedSubjects } from './seedSubjects.mjs';
import { seedUsers } from './seedUsers.mjs';
import { seedUserSubjectProfiles } from './seedUserSubjectProfiles.mjs';
import { seedUserAvailabilities } from './seedUserAvailabilities.mjs';
import { seedStudyGroups } from './seedStudyGroups.mjs';
import { seedGroupMembers } from './seedGroupMembers.mjs';
import { seedConversations } from './seedConversations.mjs';
import { seedConversationParticipants } from './seedConversationParticipants.mjs';
import { seedMessages } from './seedMessages.mjs';

async function runSeeds() {
  try {
    // Debug : afficher quelle base est utilisée
    console.log('🔍 MONGO_URI chargé:', !!process.env.MONGO_URI);
    if (process.env.MONGO_URI) {
      console.log('🌐 Connexion à Atlas...');
    } else {
      console.log('💻 Connexion à MongoDB local...');
    }

    await connectMongo(console);

    console.log('🌱 Démarrage du seeding...');
    
    await seedCities();
    await seedInstitutions();
    await seedFieldsOfStudy();
    await seedSubjects();
    await seedUsers();
    await seedUserSubjectProfiles();
    await seedUserAvailabilities();
    await seedStudyGroups();
    await seedGroupMembers();
    await seedConversations();
    await seedConversationParticipants();
    await seedMessages();

    console.log('✅ Tous les seeds exécutés avec succès');
  } catch (err) {
    console.error('❌ Erreur lors du seeding global:', err);
    process.exit(1);
  } finally {
    await disconnectMongo(console);
    process.exit(0);
  }
}

runSeeds();