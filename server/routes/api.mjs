// server/routes/index.mjs
import express from 'express';
import jwt from 'jsonwebtoken';
import { login, register } from '../api/auth.mjs';
import { logout } from '../api/logout.mjs';
import { getConversation, getConversations, sendMessage, markAsRead } from '../api/messages.mjs';

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
import Message from '../models/Message.mjs';
import { Attachment } from '../models/Attachment.mjs';
import { UserAvailability } from '../models/UserAvailability.mjs';
import { ExternalCalendar } from '../models/ExternalCalendar.mjs';
import { AuthSession } from '../models/AuthSession.mjs';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Auth middleware
function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : req.cookies?.auth_token;
    
    if (!token) {
      return res.status(401).json({ error: 'Token requis' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

// Auth routes
router.post('/auth/login', login);
router.post('/auth/register', register);
router.post('/auth/logout', logout);

// Private messaging routes (require authentication)
router.get('/pm/conversations', authMiddleware, getConversations);
router.get('/pm/conversation/:partner', authMiddleware, getConversation);
router.post('/pm/send', authMiddleware, sendMessage);
router.post('/pm/read/:partner', authMiddleware, markAsRead);

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

// Get users with their subject profiles (for suggestions)
router.get('/users-with-subjects', async (req, res) => {
  try {
    const users = await User.find()
      .populate('city_id institution_id field_id')
      .lean();
    
    // Get all subject profiles
    const profiles = await UserSubjectProfile.find()
      .populate('subject_id')
      .lean();
    
    // Group profiles by user_id
    const profilesByUser = {};
    profiles.forEach(profile => {
      const odaUserId = profile.user_id.toString();
      if (!profilesByUser[odaUserId]) {
        profilesByUser[odaUserId] = [];
      }
      profilesByUser[odaUserId].push({
        subject: profile.subject_id?.name || 'Unknown',
        canHelp: profile.can_help,
        needsHelp: profile.needs_help,
        level: profile.level
      });
    });
    
    // Merge users with their profiles
    const usersWithSubjects = users.map(user => ({
      ...user,
      subjects: profilesByUser[user._id.toString()] || []
    }));
    
    res.json(usersWithSubjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de récupérer les utilisateurs avec matières' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'id est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    const user = await User.findById(id)
      .populate('city_id institution_id field_id');

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de récupérer l’utilisateur' });
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

router.get('/cities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'id est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de ville invalide' });
    }

    const city = await City.findById(id);

    if (!city) {
      return res.status(404).json({ error: 'Ville introuvable' });
    }

    res.json(city);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de récupérer la ville' });
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

router.get('/institutions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'id est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de l’institution invalide' });
    }

    const institution = await Institution.findById(id).populate('city_id');

    if (!institution) {
      return res.status(404).json({ error: 'Institution introuvable' });
    }

    res.json(institution);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer l’institution" });
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

router.get('/fields/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'id est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de filière invalide' });
    }

    const field = await FieldOfStudy.findById(id);

    if (!field) {
      return res.status(404).json({ error: 'Filière introuvable' });
    }

    res.json(field);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de récupérer la filière' });
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

router.get('/subjects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'id est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de matière invalide' });
    }

    const subject = await Subject.findById(id).populate('field_id');

    if (!subject) {
      return res.status(404).json({ error: 'Matière introuvable' });
    }

    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer la matière" });
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

router.get('/user-subject-profiles/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'id est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de profil utilisateur-matière invalide' });
    }

    const profile = await UserSubjectProfile.findById(id)
      .populate('user_id subject_id');

    if (!profile) {
      return res.status(404).json({ error: 'Profil utilisateur-matière introuvable' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer le profil utilisateur-matière" });
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

router.get('/study-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'id est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de study group invalide' });
    }

    const group = await StudyGroup.findById(id)
      .populate('creator_id subject_id city_id');

    if (!group) {
      return res.status(404).json({ error: 'Study group introuvable' });
    }

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer le study group" });
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

router.get('/group-members/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'id est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de membre de groupe invalide' });
    }

    const member = await GroupMember.findById(id)
      .populate('user_id group_id');

    if (!member) {
      return res.status(404).json({ error: 'Membre de groupe introuvable' });
    }

    res.json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer le membre de groupe" });
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

router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log("A");
    // Vérifier que l'id est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de conversation invalide' });
    }

    const convo = await Conversation.findById(id).populate('group_id');

    if (!convo) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }

    res.json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer la conversation" });
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

router.get('/conversation-participants/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'id est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de participant de conversation invalide' });
    }

    const participant = await ConversationParticipant.findById(id)
      .populate('conversation_id user_id');

    if (!participant) {
      return res.status(404).json({ error: 'Participant de conversation introuvable' });
    }

    res.json(participant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer le participant de conversation" });
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

router.get('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'id est un ObjectId valide
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de message invalide' });
    }

    const message = await Message.findById(id)
      .populate('sender_id conversation_id parent_id');

    if (!message) {
      return res.status(404).json({ error: 'Message introuvable' });
    }

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer le message" });
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

router.get('/attachments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validation ObjectId Mongo
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de pièce jointe invalide' });
    }

    const attachment = await Attachment.findById(id)
      .populate('message_id');

    if (!attachment) {
      return res.status(404).json({ error: 'Pièce jointe introuvable' });
    }

    res.json(attachment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer la pièce jointe" });
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

router.get('/user-availabilities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validation ObjectId Mongo
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de disponibilité invalide' });
    }

    const availability = await UserAvailability.findById(id)
      .populate('user_id');

    if (!availability) {
      return res.status(404).json({ error: 'Disponibilité utilisateur introuvable' });
    }

    res.json(availability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer la disponibilité utilisateur" });
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

router.get('/external-calendars/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validation ObjectId Mongo
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de calendrier externe invalide' });
    }

    const calendar = await ExternalCalendar.findById(id)
      .populate('user_id');

    if (!calendar) {
      return res.status(404).json({ error: 'Calendrier externe introuvable' });
    }

    res.json(calendar);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer le calendrier externe" });
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

router.get('/auth-sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validation ObjectId Mongo
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID de session invalide' });
    }

    const session = await AuthSession.findById(id)
      .populate('user_id');

    if (!session) {
      return res.status(404).json({ error: "Session d'authentification introuvable" });
    }

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer la session d'authentification" });
  }
});

export default router;