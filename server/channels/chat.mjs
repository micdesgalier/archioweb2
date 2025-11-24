import { WSServerError } from 'wsmini';
import { wsServer } from '../store/wsStore.mjs';
import { sendUserList } from './users.mjs';

/**
 * Setup the chat channel
 * This channel handles public chat messages
 */
export function setupChatChannel() {
  wsServer.addChannel('chat', {
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
    hookSubPost: sendUserList,
    hookUnsubPost: sendUserList,
  });
}
