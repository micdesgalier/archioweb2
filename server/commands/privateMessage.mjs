import { WSServerError } from 'wsmini';
import { wsServer } from '../store/wsStore.mjs';

/**
 * RPC command to send a private message
 * @param {string} data - String format: "username message content"
 * @param {Object} client - Client metadata with username and color
 */
export function privateMessageCommand(data, { username, color }) {
  if (typeof data !== 'string' || data.trim().length < 3) {
    throw new WSServerError('No message content');
  }

  const [to, ...content] = data.split(' ');
  const msg = content.join(' ');

  const allClients = wsServer.getChannelClients('chat');
  const toClients = allClients.filter(c => wsServer.clients.get(c).username === to);

  if (toClients.length === 0) {
    throw new WSServerError('Recipient not found');
  }

  const fromClients = allClients.filter(c => wsServer.clients.get(c).username === username);

  const info = {
    type: 'pm',
    content: msg,
    from: username,
    to: to,
    fromColor: color,
    toColor: wsServer.clients.get(toClients[0]).color,
    timestamp: Date.now(),
  };

  // Send to sender
  for (const fromSocket of fromClients) {
    wsServer.sendCmd(fromSocket, 'pm', info);
  }

  // Send to recipient
  for (const toSocket of toClients) {
    wsServer.sendCmd(toSocket, 'pm', info);
  }
}
