// server/scripts/seedUserAvailabilities.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import UserAvailability from '../models/UserAvailability.mjs';
import { fileURLToPath } from 'url';

/**
 * Seed callable depuis seedAll.js
 * ⚠️ Ne gère PAS la connexion MongoDB
 */
export async function seedUserAvailabilities() {
  const users = await User.find();

  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé — seedUsers requis avant.');
    return;
  }

  for (const user of users) {
    /** ------------------------------
     * Disponibilité ponctuelle
     * Aujourd’hui de 14h à 16h
     * ------------------------------ */
    const startTime = new Date();
    startTime.setHours(14, 0, 0, 0);

    const endTime = new Date();
    endTime.setHours(16, 0, 0, 0);

    const existsOneTime = await UserAvailability.findOne({
      user_id: user._id,
      start_time: startTime,
      end_time: endTime,
      is_recurring: false,
    });

    if (!existsOneTime) {
      await UserAvailability.create({
        user_id: user._id,
        start_time: startTime,
        end_time: endTime,
        is_recurring: false,
      });
      console.log(`Seeded one-time availability: ${user.email}`);
    } else {
      console.log(`One-time availability exists: ${user.email}`);
    }

    /** ------------------------------
     * Disponibilité récurrente
     * Lundi & mercredi de 10h à 12h
     * ------------------------------ */
    const recurringStart = new Date();
    recurringStart.setHours(10, 0, 0, 0);

    const recurringEnd = new Date();
    recurringEnd.setHours(12, 0, 0, 0);

    const existsRecurring = await UserAvailability.findOne({
      user_id: user._id,
      start_time: recurringStart,
      end_time: recurringEnd,
      is_recurring: true,
    });

    if (!existsRecurring) {
      await UserAvailability.create({
        user_id: user._id,
        start_time: recurringStart,
        end_time: recurringEnd,
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO,WE',
      });
      console.log(`Seeded recurring availability: ${user.email}`);
    } else {
      console.log(`Recurring availability exists: ${user.email}`);
    }
  }
}

/**
 * Exécution standalone
 * node server/scripts/seedUserAvailabilities.mjs
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedUserAvailabilities();
      console.log('✅ seedUserAvailabilities exécuté (standalone)');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur seedUserAvailabilities:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}