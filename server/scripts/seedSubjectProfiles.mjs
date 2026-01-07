// server/scripts/seedSubjectProfiles.mjs
import { connectMongo, disconnectMongo } from '../db/mongo.mjs';
import User from '../models/User.mjs';
import Subject from '../models/Subject.mjs';
import UserSubjectProfile from '../models/UserSubjectProfile.mjs';
import { fileURLToPath } from 'url';

// Demo subjects to create if they don't exist
const subjectsToSeed = [
  { name: 'Programmation', code: 'PROG' },
  { name: 'Mathématiques', code: 'MATH' },
  { name: 'Physique', code: 'PHYS' },
  { name: 'Français', code: 'FR' },
  { name: 'Anglais', code: 'EN' },
  { name: 'Chimie', code: 'CHIM' },
  { name: 'Biologie', code: 'BIO' },
  { name: 'Économie', code: 'ECO' },
];

// Demo profiles: [user_email, subject_code, can_help, needs_help]
const profilesToSeed = [
  // Alice - bonne en prog, besoin d'aide en maths
  ['alice.dupont@example.com', 'PROG', true, false],
  ['alice.dupont@example.com', 'MATH', false, true],
  
  // Bob - bon en maths et physique, besoin d'aide en français
  ['bob.martin@example.com', 'MATH', true, false],
  ['bob.martin@example.com', 'PHYS', true, false],
  ['bob.martin@example.com', 'FR', false, true],
  
  // Caroline - bonne en physique, besoin d'aide en prog
  ['caroline.petit@example.com', 'PHYS', true, false],
  ['caroline.petit@example.com', 'PROG', false, true],
  
  // David - bon en biologie, besoin d'aide en chimie
  ['david.lemoine@example.com', 'BIO', true, false],
  ['david.lemoine@example.com', 'CHIM', false, true],
  
  // Émilie - bonne en français et anglais
  ['emilie.moreau@example.com', 'FR', true, false],
  ['emilie.moreau@example.com', 'EN', true, false],
];

export async function seedSubjectProfiles() {
  // First, seed subjects
  const subjectMap = {};
  for (const s of subjectsToSeed) {
    let subject = await Subject.findOne({ code: s.code });
    if (!subject) {
      subject = new Subject(s);
      await subject.save();
      console.log('Created subject:', s.name);
    }
    subjectMap[s.code] = subject._id;
  }

  // Then seed user profiles
  for (const [email, subjectCode, canHelp, needsHelp] of profilesToSeed) {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      continue;
    }

    const subjectId = subjectMap[subjectCode];
    if (!subjectId) {
      console.log('Subject not found:', subjectCode);
      continue;
    }

    // Check if profile already exists
    const exists = await UserSubjectProfile.findOne({
      user_id: user._id,
      subject_id: subjectId
    });

    if (!exists) {
      const profile = new UserSubjectProfile({
        user_id: user._id,
        subject_id: subjectId,
        can_help: canHelp,
        needs_help: needsHelp,
        level: canHelp ? 4 : 2
      });
      await profile.save();
      console.log(`Created profile: ${email} - ${subjectCode} (canHelp: ${canHelp}, needsHelp: ${needsHelp})`);
    } else {
      console.log(`Profile already exists: ${email} - ${subjectCode}`);
    }
  }
}

// Run standalone
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  (async () => {
    try {
      await connectMongo(console);
      await seedSubjectProfiles();
      console.log('✅ seedSubjectProfiles completed');
      await disconnectMongo(console);
      process.exit(0);
    } catch (err) {
      console.error('❌ Error:', err);
      try { await disconnectMongo(console); } catch (_) {}
      process.exit(1);
    }
  })();
}

