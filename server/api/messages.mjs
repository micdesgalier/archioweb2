import Message from '../models/Message.mjs';
import Conversation from '../models/Conversation.mjs';
import User from '../models/User.mjs';
import { wsServer } from '../store/wsStore.mjs';

/**
 * Get conversation history between two users
 */
export async function getConversation(req, res) {
  const { partner } = req.params;
  const currentUser = req.user?.firstName;

  if (!currentUser) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  if (!partner) {
    return res.status(400).json({ error: 'Partenaire de conversation requis' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { from: currentUser, to: partner },
        { from: partner, to: currentUser }
      ]
    })
    .sort({ timestamp: 1 })
    .limit(100)
    .lean();

    res.json(messages);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
}

/**
 * Get all conversations for the current user
 */
export async function getConversations(req, res) {
  const currentUser = req.user?.firstName;

  if (!currentUser) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    const sentMessages = await Message.distinct('to', { from: currentUser });
    const receivedMessages = await Message.distinct('from', { to: currentUser });
    
    const partners = [...new Set([...sentMessages, ...receivedMessages])];
    
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

      return {
        partner,
        lastMessage,
        unreadCount
      };
    }));

    conversations.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || 0;
      const timeB = b.lastMessage?.timestamp || 0;
      return new Date(timeB) - new Date(timeA);
    });

    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
  }
}

export async function sendMessage(req, res) {
  console.log("TESSSSSSST");
  const { to, content } = req.body;
  const currentUserId = req.user?._id; // ObjectId de l'utilisateur connecté
  const currentUserName = req.user?.firstName || req.user?.username;

  if (!currentUserId) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  if (!to || !content) {
    return res.status(400).json({ error: 'Destinataire et contenu requis' });
  }

  if (content.length > 2000) {
    return res.status(400).json({ error: 'Message trop long (max 2000 caractères)' });
  }

  try {
    // Trouver le destinataire par username
    const recipient = await User.findOne({ first_name: to });
    if (!recipient) {
      console.log(to);
      return res.status(404).json({ error: 'Destinataire introuvable' });
    }

    // Toujours trier les IDs pour éviter doublons A-B / B-A
    const participants = [currentUserId, recipient._id].sort();

    // Chercher conversation existante
    let conversation = await Conversation.findOne({
      type: 'private',
      members: { $all: [currentUserId, recipient._id] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: 'private',
        members: [currentUserId, recipient._id] // ✅ BON CHAMP
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

    // Envoi WebSocket
    try {
      if (wsServer) {
        const allClients = wsServer.getChannelClients('chat');

        const toClients = allClients.filter(c => wsServer.clients.get(c)?.username === to);
        for (const toSocket of toClients) {
          wsServer.sendCmd(toSocket, 'pm', messageData);
        }

        const fromClients = allClients.filter(c => wsServer.clients.get(c)?.username === currentUserName);
        for (const fromSocket of fromClients) {
          wsServer.sendCmd(fromSocket, 'pm', messageData);
        }
      }
    } catch (wsErr) {
      console.log('WebSocket send failed (user may be offline):', wsErr.message);
    }

    res.json(messageData);

  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
  }
}

/**
 * Mark messages as read
 */
export async function markAsRead(req, res) {
  const { partner } = req.params;
  const currentUser = req.user?.firstName;

  if (!currentUser) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  try {
    await Message.updateMany(
      { from: partner, to: currentUser, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking messages as read:', err);
    res.status(500).json({ error: 'Erreur' });
  }
}

