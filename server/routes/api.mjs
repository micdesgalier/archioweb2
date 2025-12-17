// server/routes/index.mjs
import express from 'express';
import { login } from '../api/auth.mjs';
import { logout } from '../api/logout.mjs';

import { Book } from '../models/Book.mjs';
import { User } from '../models/User.mjs';
import { City } from '../models/City.mjs';
import { Institution } from '../models/Institution.mjs';
import { FieldOfStudy } from '../models/FieldOfStudy.mjs';
import { Subject } from '../models/Subject.mjs';
import { UserSubjectProfile } from '../models/UserSubjectProfile.mjs';
import { StudyGroup } from '../models/StudyGroup.mjs';
import { GroupMember } from '../models/GroupMember.mjs';
import { Conversation } from '../models/Conversation.mjs';
import { ConversationParticipant } from '../models/ConversationParticipant.mjs';
import { Message } from '../models/Message.mjs';
import { Attachment } from '../models/Attachment.mjs';
import { UserAvailability } from '../models/UserAvailability.mjs';
import { ExternalCalendar } from '../models/ExternalCalendar.mjs';
import { AuthSession } from '../models/AuthSession.mjs';

const router = express.Router();

// Auth routes
router.post('/auth/login', login);
router.post('/auth/logout', logout);

// Books
router.get('/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de récupérer les livres' });
  }
});

// Users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .populate('city_id institution_id field_id');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de récupérer les utilisateurs' });
  }
});

// Cities
router.get('/cities', async (req, res) => {
  try {
    const cities = await City.find();
    res.json(cities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de récupérer les villes' });
  }
});

// Institutions
router.get('/institutions', async (req, res) => {
  try {
    const institutions = await Institution.find().populate('city_id');
    res.json(institutions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les institutions" });
  }
});

// Fields of study
router.get('/fields', async (req, res) => {
  try {
    const fields = await FieldOfStudy.find();
    res.json(fields);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de récupérer les filières' });
  }
});

// Subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find().populate('field_id');
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les matières" });
  }
});

// User subject profiles
router.get('/user-subject-profiles', async (req, res) => {
  try {
    const profiles = await UserSubjectProfile.find()
      .populate('user_id subject_id');
    res.json(profiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les profils matière/utilisateur" });
  }
});

// Study groups
router.get('/study-groups', async (req, res) => {
  try {
    const groups = await StudyGroup.find()
      .populate('creator_id subject_id city_id');
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les study groups" });
  }
});

// Group members
router.get('/group-members', async (req, res) => {
  try {
    const members = await GroupMember.find().populate('user_id group_id');
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les membres de groupes" });
  }
});

// Conversations
router.get('/conversations', async (req, res) => {
  try {
    const convos = await Conversation.find().populate('group_id');
    res.json(convos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les conversations" });
  }
});

// Conversation participants
router.get('/conversation-participants', async (req, res) => {
  try {
    const parts = await ConversationParticipant.find().populate('conversation_id user_id');
    res.json(parts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les participants de conversations" });
  }
});

// Messages (dernier batch)
router.get('/messages', async (req, res) => {
  try {
    // par défaut : renvoyer les 100 derniers messages
    const messages = await Message.find()
      .sort({ created_at: -1 })
      .limit(100)
      .populate('sender_id conversation_id parent_id');
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les messages" });
  }
});

// Attachments
router.get('/attachments', async (req, res) => {
  try {
    const atts = await Attachment.find().populate('message_id');
    res.json(atts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les pièces jointes" });
  }
});

// User availabilities
router.get('/user-availabilities', async (req, res) => {
  try {
    const avails = await UserAvailability.find().populate('user_id');
    res.json(avails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les disponibilités utilisateurs" });
  }
});

// External calendars
router.get('/external-calendars', async (req, res) => {
  try {
    const cals = await ExternalCalendar.find().populate('user_id');
    res.json(cals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les calendriers externes" });
  }
});

// Auth sessions
router.get('/auth-sessions', async (req, res) => {
  try {
    const sessions = await AuthSession.find().populate('user_id');
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les sessions d'authentification" });
  }
});

export default router;