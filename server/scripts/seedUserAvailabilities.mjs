// server/scripts/seedUserAvailabilities.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import UserAvailability from '../models/UserAvailability.mjs';

async function main() {
  await connectMongo(console);

  const users = await User.find();
  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé. Exécute d’abord le seed des utilisateurs.');
    process.exit(0);
  }

  for (const user of users) {
    // Disponibilité ponctuelle (aujourd'hui de 14h à 16h)
    const startTime = new Date();
    startTime.setHours(14, 0, 0, 0);
    const endTime = new Date();
    endTime.setHours(16, 0, 0, 0);

    const existsOneTime = await UserAvailability.findOne({
      user_id: user._id,
      start_time: startTime,
      end_time: endTime,
    });

    if (!existsOneTime) {
      const availabilityOneTime = new UserAvailability({
        user_id: user._id,
        start_time: startTime,
        end_time: endTime,
        is_recurring: false,
      });
      await availabilityOneTime.save();
      console.log(`Seeded one-time availability for user: ${user.email}`);
    } else {
      console.log(`One-time availability already exists for user: ${user.email}`);
    }

    // Disponibilité récurrente (tous les lundis et mercredis de 10h à 12h)
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
      const availabilityRecurring = new UserAvailability({
        user_id: user._id,
        start_time: recurringStart,
        end_time: recurringEnd,
        is_recurring: true,
        recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO,WE',
      });
      await availabilityRecurring.save();
      console.log(`Seeded recurring availability for user: ${user.email}`);
    } else {
      console.log(`Recurring availability already exists for user: ${user.email}`);
    }
  }

  await disconnectMongo(console);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });