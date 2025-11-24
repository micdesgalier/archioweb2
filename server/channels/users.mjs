import { wsServer } from '../store/wsStore.mjs';

/**
 * Send the list of connected users to all clients
 */
export function sendUserList() {
  const clientsData = wsServer.getChannelClientsData('chat');
  const usersList = [...new Set(clientsData.map(({ username }) => username))];
  wsServer.pub('users', usersList);
  return true;
}

/**
 * Setup the users channel
 * This channel is read-only for clients and broadcasts the list of connected users
 */
export function setupUsersChannel() {
  wsServer.addChannel('users', {
    usersCanPub: false
  });
}
