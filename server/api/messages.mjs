import Message from '../models/Message.mjs';
import Conversation from '../models/Conversation.mjs';
import User from '../models/User.mjs';
import { wsServer } from '../store/wsStore.mjs';

/**
 * Récupérer l'historique de conversation entre l'utilisateur connecté et un partenaire
 */
export async function getConversation(req, res) {
  const { partner } = req.params;
  const currentUser = req.user?.firstName;

  if (!currentUser) return res.status(401).json({ error: 'Non authentifié' });
  if (!partner) return res.status(400).json({ error: 'Partenaire de conversation requis' });

  try {
    const messages = await Message.find({
      $or: [
        { from: currentUser, to: partner },
        { from: partner, to: currentUser }
      ]
    })
      .sort({ timestamp: 1 }) // tri chronologique
      .limit(100)
      .lean();

    res.json(messages);
  } catch (err) {
    console.error('Erreur lors de la récupération des messages :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
}

/**
 * Récupérer toutes les conversations de l'utilisateur connecté
 */
export async function getConversations(req, res) {
  const currentUser = req.user?.firstName;
  if (!currentUser) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const sentMessages = await Message.distinct('to', { from: currentUser });
    const receivedMessages = await Message.distinct('from', { to: currentUser });
    const partners = [...new Set([...sentMessages, ...receivedMessages])]; // éviter doublons

    const conversations = await Promise.all(partners.map(async (partner) => {
      const lastMessage = await Message.findOne({
        $or: [
          { from: currentUser, to: partner },
          { from: partner, to: currentUser }
        ]
      })
        .sort({ timestamp: -1 })
        .lean();

      const unreadCount = await Message.countDocuments({
        from: partner,
        to: currentUser,
        read: false
      });

      return { partner, lastMessage, unreadCount };
    }));

    // Tri par dernier message
    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return new Date(timeB) - new Date(timeA);
    });

    res.json(conversations);
  } catch (err) {
    console.error('Erreur lors de la récupération des conversations :', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
  }
}

/**
 * Envoyer un message privé
 */
export async function sendMessage(req, res) {
  const { to, content } = req.body;
  const currentUserId = req.user?._id;
  const currentUserName = req.user?.firstName || req.user?.username;

  if (!currentUserId) return res.status(401).json({ error: 'Non authentifié' });
  if (!to || !content) return res.status(400).json({ error: 'Destinataire et contenu requis' });
  if (content.length > 2000) return res.status(400).json({ error: 'Message trop long (max 2000 caractères)' });

  try {
    const recipient = await User.findOne({ first_name: to });
    if (!recipient) return res.status(404).json({ error: 'Destinataire introuvable' });

    // Chercher ou créer la conversation privée
    let conversation = await Conversation.findOne({
      type: 'private',
      members: { $all: [currentUserId, recipient._id] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'private',
        members: [currentUserId, recipient._id]
      });
    }

    const message = new Message({
      sender_id: currentUserId,
      receiver_id: recipient._id,
      conversation_id: conversation._id,
      sender_name: currentUserName,
      receiver_name: recipient.first_name || recipient.username,
      content,
      timestamp: new Date(),
      read: false,
      type: 'pm'
    });

    await message.save();

    const messageData = {
      _id: message._id,
      type: message.type,
      content: message.content,
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      sender_name: message.sender_name,
      receiver_name: message.receiver_name,
      timestamp: message.timestamp.getTime(),
      read: message.read
    };

    // Envoi du message via WebSocket aux participants connectés
    try {
      if (wsServer) {
        const allClients = wsServer.getChannelClients('chat');

        const toClients = allClients.filter(c => wsServer.clients.get(c)?.username === to);
        toClients.forEach(c => wsServer.sendCmd(c, 'pm', messageData));

        const fromClients = allClients.filter(c => wsServer.clients.get(c)?.username === currentUserName);
        fromClients.forEach(c => wsServer.sendCmd(c, 'pm', messageData));
      }
    } catch (wsErr) {
      console.log('WebSocket send failed (utilisateur peut être hors ligne) :', wsErr.message);
    }

    res.json(messageData);

  } catch (err) {
    console.error('Erreur lors de l\'envoi du message :', err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
}

/**
 * Marquer tous les messages d'un partenaire comme lus
 */
export async function markAsRead(req, res) {
  const { partner } = req.params;
  const currentUser = req.user?.firstName;

  if (!currentUser) return res.status(401).json({ error: 'Non authentifié' });

  try {
    await Message.updateMany(
      { from: partner, to: currentUser, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Erreur lors du marquage des messages comme lus :', err);
    res.status(500).json({ error: 'Erreur' });
  }
}