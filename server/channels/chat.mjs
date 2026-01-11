import { WSServerError } from 'wsmini';
import { wsServer } from '../store/wsStore.mjs';
import { sendUserList } from './users.mjs';

/**
 * Configure le canal de chat
 * Ce canal gère les messages publics du chat
 */
export function setupChatChannel() {
  wsServer.addChannel('chat', {
    // Valide et formate chaque message avant diffusion
    hookPub: (msg, client) => {
      if (!msg || !msg.content || typeof msg.content !== 'string') {
        throw new WSServerError('Invalid message format');
      }
      if (msg.content.length > 500) {
        throw new WSServerError('Message too long (max 500 characters)');
      }
      
      return {
        type: 'message',
        content: msg.content,
        username: client.username,
        color: client.color,
        timestamp: Date.now()
      };
    },
    // Met à jour la liste des utilisateurs après chaque abonnement/désabonnement
    hookSubPost: sendUserList,
    hookUnsubPost: sendUserList,
  });
}