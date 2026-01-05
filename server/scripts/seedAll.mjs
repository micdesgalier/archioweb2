// server/scripts/seedAll.mjs
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
    await connectMongo(console);

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

    console.log('✅ Tous les seeds exécutés');
  } catch (err) {
    console.error('❌ Erreur lors du seeding global:', err);
  } finally {
    await disconnectMongo(console);
    process.exit(0);
  }
}

runSeeds();