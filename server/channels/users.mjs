import { wsServer } from '../store/wsStore.mjs';

/**
 * Envoie la liste des utilisateurs connectés à tous les clients
 */
export function sendUserList() {
  // Récupère les données des clients sur le canal "chat"
  const clientsData = wsServer.getChannelClientsData('chat');

  // Extraire les noms d'utilisateur uniques
  const usersList = [...new Set(clientsData.map(({ username }) => username))];

  // Publier la liste sur le canal "users" pour tous les clients
  wsServer.pub('users', usersList);

  return true;
}

/**
 * Configuration du canal "users"
 * Ce canal est en lecture seule pour les clients et diffuse la liste des utilisateurs connectés
 */
export function setupUsersChannel() {
  wsServer.addChannel('users', {
    usersCanPub: false // Les clients ne peuvent pas publier sur ce canal
  });
}