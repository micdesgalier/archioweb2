import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

import { login, register } from '../api/auth.mjs';
import { logout } from '../api/logout.mjs';
import {
  getConversation,
  getConversations,
  sendMessage,
  markAsRead
} from '../api/messages.mjs';

import uploadRouter from './upload.mjs';

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

/**
 * Middleware d'authentification compatible DEV / PROD / TEST
 * En mode test, génère un utilisateur fictif avec un ObjectId valide
 */
function authMiddleware(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    const testUserId = new mongoose.Types.ObjectId();

    req.user = {
      sub: testUserId.toString(),
      _id: testUserId,
      firstName: 'Test',
      username: 'test'
    };
    req.userId = testUserId.toString();

    return next();
  }

  // Mode production : vérification du JWT
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.auth_token;

    if (!token) return res.status(401).json({ error: 'Token requis' });

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    req.user = decoded;
    req.userId = decoded.sub;
    req.user._id = decoded.sub;

    next();
  } catch (err) {
    console.error('authMiddleware error:', err.message);
    return res.status(401).json({ error: 'Token invalide' });
  }
}

/* =====================================================
 * AUTHENTIFICATION
 * ===================================================== */
router.post('/auth/login', login);
router.post('/auth/register', register);
router.post('/auth/logout', logout);

/* =====================================================
 * UPLOAD DE FICHIERS
 * ===================================================== */
router.use(uploadRouter);

/* =====================================================
 * MESSAGERIE PRIVÉE
 * ===================================================== */
router.get('/pm/conversations', authMiddleware, getConversations);
router.get('/pm/conversation/:partner', authMiddleware, getConversation);
router.post('/pm/send', authMiddleware, sendMessage);
router.post('/pm/read/:partner', authMiddleware, markAsRead);

/* =====================================================
 * PROFIL UTILISATEUR COURANT
 * ===================================================== */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    const user = await User.findById(userId)
      .populate('city_id institution_id field_id')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    // Récupération des matières et niveaux de l'utilisateur
    const profiles = await UserSubjectProfile.find({ user_id: userId })
      .populate('subject_id')
      .lean();

    const subjects = profiles.map(p => ({
      subject: p.subject_id?.name ?? 'Unknown',
      canHelp: p.can_help,
      needsHelp: p.needs_help,
      level: p.level
    }));

    // Récupération des disponibilités
    const availabilities = await UserAvailability.find({ user_id: userId })
      .sort({ start_time: 1 })
      .lean();

    res.json({
      ...user,
      subjects,
      availabilities
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Impossible de récupérer le profil utilisateur' });
  }
});

/* =====================================================
 * UTILISATEURS
 * ===================================================== */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .populate('city_id institution_id field_id');
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Impossible de récupérer les utilisateurs' });
  }
});

/**
 * Récupère tous les utilisateurs avec leurs matières associées
 */
router.get('/users-with-subjects', async (req, res) => {
  try {
    const users = await User.find()
      .populate('city_id institution_id field_id')
      .lean();

    const profiles = await UserSubjectProfile.find()
      .populate('subject_id')
      .lean();

    // Regroupement des matières par utilisateur
    const profilesByUser = {};
    profiles.forEach(p => {
      const id = p.user_id.toString();
      profilesByUser[id] ??= [];
      profilesByUser[id].push({
        subject: p.subject_id?.name ?? 'Unknown',
        canHelp: p.can_help,
        needsHelp: p.needs_help,
        level: p.level
      });
    });

    res.json(users.map(u => ({
      ...u,
      subjects: profilesByUser[u._id.toString()] ?? []
    })));
  } catch {
    res.status(500).json({ error: 'Impossible de récupérer les utilisateurs avec matières' });
  }
});

router.get('/users/:id', async (req, res) => {
  if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ error: 'ID utilisateur invalide' });
  }

  const user = await User.findById(req.params.id)
    .populate('city_id institution_id field_id');

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable' });
  }

  res.json(user);
});

/**
 * Mise à jour d'un utilisateur
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    // Champs autorisés à la modification
    const allowedFields = [
      'first_name',
      'last_name',
      'birth_date',
      'city_id',
      'institution_id',
      'field_id',
      'study_year',
      'bio',
      'avatar_url',
    ];

    // Construction de l'objet de mise à jour avec uniquement les champs fournis
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('city_id institution_id field_id');

    if (!updatedUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: "Impossible de mettre à jour l'utilisateur" });
  }
});

/* =====================================================
 * VILLES
 * ===================================================== */
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

/* =====================================================
 * INSTITUTIONS
 * ===================================================== */
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

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "ID de l'institution invalide" });
    }

    const institution = await Institution.findById(id).populate('city_id');

    if (!institution) {
      return res.status(404).json({ error: 'Institution introuvable' });
    }

    res.json(institution);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer l'institution" });
  }
});

/* =====================================================
 * FILIÈRES D'ÉTUDES
 * ===================================================== */
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

/* =====================================================
 * MATIÈRES
 * ===================================================== */
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

/* =====================================================
 * PROFILS MATIÈRE/UTILISATEUR
 * ===================================================== */
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

/* =====================================================
 * GROUPES D'ÉTUDE
 * ===================================================== */
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

/**
 * Création d'un study group
 * Le créateur est automatiquement défini depuis le token JWT
 */
router.post('/study-groups', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;  

    const {
      title,
      description,
      subject_id,
      city_id,
      location_detail,
      is_online,
      start_time,
      end_time,
      max_members,
    } = req.body;

    if (!title || typeof is_online !== 'boolean') {
      return res.status(400).json({
        error: 'Titre et is_online sont requis',
      });
    }

    const group = await StudyGroup.create({
      title,
      description,
      creator_id: userId,
      subject_id: subject_id || null,
      city_id: is_online ? null : city_id || null,
      location_detail,
      is_online,
      start_time,
      end_time,
      max_members,
    });

    res.status(201).json(group);
  } catch (err) {
    console.error('Create study group error:', err);
    res.status(400).json({
      error: err.message || 'Impossible de créer le study group',
    });
  }
});

/**
 * Statistiques : nombre de study groups créés par utilisateur
 */
router.get('/stats/user-study-groups', async (req, res) => {
  try {
    const studyGroupColl = StudyGroup.collection.name;

    const stats = await User.aggregate([
      {
        $lookup: {
          from: studyGroupColl,
          localField: '_id',
          foreignField: 'creator_id',
          as: 'groups'
        }
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          email: '$email',
          first_name: '$first_name',
          last_name: '$last_name',
          totalGroups: { $size: '$groups' }
        }
      },
      { $sort: { totalGroups: -1, email: 1 } }
    ]);

    res.json(stats);
  } catch (err) {
    console.error('Error fetching user study-group stats:', err);
    res.status(500).json({ error: 'Impossible de récupérer les statistiques' });
  }
});

/* =====================================================
 * MEMBRES DE GROUPES
 * ===================================================== */
router.get('/group-members', async (req, res) => {
  try {
    const members = await GroupMember.find().populate('user_id group_id');
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les membres de groupes" });
  }
});

/**
 * Rejoindre un groupe d'étude
 */
router.post('/group-members', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { group_id } = req.body;

    if (!group_id) {
      return res.status(400).json({ error: 'group_id est requis' });
    }

    // Vérifier si l'utilisateur est déjà membre
    const existing = await GroupMember.findOne({
      group_id,
      user_id: userId,
      status: { $ne: 'left' }
    });

    if (existing) {
      return res.status(400).json({ error: 'Vous êtes déjà membre de ce groupe' });
    }

    const member = await GroupMember.create({
      group_id,
      user_id: userId,
      role: 'member',
      status: 'joined'
    });

    await member.populate('user_id group_id');
    res.status(201).json(member);
  } catch (err) {
    console.error('Error joining group:', err);
    res.status(400).json({
      error: err.message || 'Impossible de rejoindre le groupe'
    });
  }
});

router.get('/group-members/:id', async (req, res) => {
  try {
    const { id } = req.params;

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

/**
 * Récupération des messages d'un groupe (placeholder pour futur système de messagerie de groupe)
 */
router.get('/group-messages/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const conversation = await Conversation.findOne({ type: 'group', group_id: groupId });
    
    if (!conversation) {
      return res.json({
        lastMessage: null,
        unreadCount: 0
      });
    }

    // TODO: Implémenter la messagerie de groupe complète
    res.json({
      lastMessage: null,
      unreadCount: 0
    });
  } catch (err) {
    console.error('Error fetching group messages:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
});

/* =====================================================
 * CONVERSATIONS
 * ===================================================== */
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

/* =====================================================
 * PARTICIPANTS DE CONVERSATIONS
 * ===================================================== */
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

/* =====================================================
 * MESSAGES
 * ===================================================== */
/**
 * Récupération des 100 derniers messages (ordre décroissant)
 */
router.get('/messages', async (req, res) => {
  try {
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

/**
 * Récupération paginée des messages
 */
router.get('/messages/paginated', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender_id receiver_id conversation_id')
      .lean();

    const total = await Message.countDocuments();

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: messages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Impossible de récupérer les messages paginés' });
  }
});

router.get('/messages/:id/attachments', async (req, res) => {
  try {
    const attachments = await Attachment.find({
      message_id: req.params.id
    }).lean();

    res.json(attachments);
  } catch (err) {
    console.error('Error loading attachments:', err);
    res.status(500).json({ error: 'Erreur chargement pièces jointes' });
  }
});

router.get('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;

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

/**
 * Récupération d'une conversation privée avec un utilisateur spécifique
 */
router.get('/privatem/conversation/:username', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId || req.user?._id || req.user?.sub;
    if (!currentUserId) {
      return res.status(400).json({ error: 'User id manquant dans le token' });
    }

    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: "Nom d'utilisateur requis" });
    }

    // Recherche de l'utilisateur cible par prénom ou email
    const otherUser = await User.findOne({
      $or: [
        { first_name: username },
        { email: username }
      ]
    });

    if (!otherUser) {
      return res.status(404).json({ error: `Utilisateur '${username}' non trouvé` });
    }

    // Recherche de la conversation entre les deux utilisateurs
    const conversation = await Conversation.findOne({
      type: 'private',
      members: { $all: [currentUserId, otherUser._id] }
    }).lean();

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation privée non trouvée' });
    }

    // Récupération de tous les messages de la conversation
    const messages = await Message.find({ conversation_id: conversation._id })
      .sort({ timestamp: 1 })
      .populate('sender_id', 'first_name last_name avatar_url email')
      .populate('receiver_id', 'first_name last_name avatar_url email')
      .lean();

    res.json({
      conversation: {
        id: conversation._id,
        members: conversation.members,
      },
      messages,
    });

  } catch (err) {
    console.error('Error fetching messages for private conversation:', err);
    res.status(500).json({ error: 'Impossible de récupérer les messages privés' });
  }
});

/**
 * Récupération de toutes les conversations privées de l'utilisateur avec leurs messages récents
 */
router.get('/privatem/conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId || req.user?.sub || req.user?._id;
    if (!userId) {
      console.warn('No userId in request (token payload):', req.user);
      return res.status(400).json({ error: 'User id manquant dans le token' });
    }

    console.log('🔍 Recherche conversations pour userId:', userId);

    const conversations = await Conversation.find({
      type: 'private',
      members: { $in: [userId] }
    })
      .populate('members', 'first_name last_name email avatar_url')
      .populate('group_id')
      .lean();

    console.log('✅ Conversations trouvées:', conversations.length);

    const MSG_LIMIT = 50;

    const conversationsWithMessages = await Promise.all(
      conversations.map(async (convo) => {
        // Récupération des derniers messages (ordre inversé puis remis chronologiquement)
        const msgs = await Message.find({ conversation_id: convo._id })
          .sort({ timestamp: -1 })
          .limit(MSG_LIMIT)
          .populate('sender_id', 'first_name last_name avatar_url email')
          .populate('receiver_id', 'first_name last_name avatar_url email')
          .lean();

        msgs.reverse();

        const totalMessages = await Message.countDocuments({ conversation_id: convo._id });

        return {
          ...convo,
          messages: msgs,
          messagesCount: totalMessages,
        };
      })
    );

    res.json(conversationsWithMessages);
  } catch (err) {
    console.error('Error fetching private conversations with messages:', err);
    res.status(500).json({ error: 'Impossible de récupérer les conversations privées' });
  }
});

/* =====================================================
 * PIÈCES JOINTES
 * ===================================================== */
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