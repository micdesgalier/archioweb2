// server/scripts/updateGroupDatesToFebruary.mjs
// Script to update all existing group dates to February 2026
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import StudyGroup from '../models/StudyGroup.mjs';
import { fileURLToPath } from 'url';

/**
 * Update all group dates to February 2026
 */
export async function updateGroupDatesToFebruary() {
  const groups = await StudyGroup.find({ start_time: { $exists: true } });
  
  console.log(`Found ${groups.length} groups with dates to update`);
  
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    
    // Set dates to February 2026
    // First group: Feb 7, 14:47-14:47
    // Second group: Feb 7, 15:47-15:47
    // Third group: Feb 7, 16:47-16:47
    // And so on...
    const baseDate = new Date('2026-02-07');
    const startHour = 14 + (i % 3); // Cycle through 14, 15, 16
    const startMinute = 47;
    const startTime = new Date(baseDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startHour, startMinute + 2, 0, 0); // 2 minutes later
    
    await StudyGroup.updateOne(
      { _id: group._id },
      { 
        $set: { 
          start_time: startTime,
          end_time: endTime
        } 
      }
    );
    
    console.log(`Updated group "${group.title}" to ${startTime.toISOString()}`);
  }
  
  console.log('✅ All group dates updated to February 2026');
}

/**
 * Exécution standalone
 * node server/scripts/updateGroupDatesToFebruary.mjs
 */
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await updateGroupDatesToFebruary();
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur updateGroupDatesToFebruary:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}

