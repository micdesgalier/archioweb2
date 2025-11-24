import { wsServer } from '../store/wsStore.mjs';

/**
 * RPC command to send an emote message
 * @param {Object} data - Emote data
 * @param {Object} client - Client metadata
 */
export function emoteCommand(data, client) {
  wsServer.pub('chat', {
    type: 'emote',
    content: data,
    username: client.username,
    color: client.color,
    timestamp: Date.now(),
  });
}
