import { WSServerPubSub } from 'wsmini';
import { getColorForUsername } from '../utils/colorGenerator.mjs';
import { parseCookies } from '../utils/parseCookies.mjs';
import jwt from 'jsonwebtoken';

const origins = process.env.VITE_WS_HOST ?? 'localhost';
const JWT_SECRET = process.env.JWT_SECRET;

function authCallback(token, request) {
  try {
    const cookies = parseCookies(request.headers.cookie);
    const authToken = cookies?.auth_token ?? token;
    const decoded = jwt.verify(authToken, JWT_SECRET, { algorithms: ['HS256'] });
    const username = decoded.sub;

    if (!username) return false;
    if (!/^[A-Za-z]+$/.test(username)) return false;
    if (username.length > 20) return false;

    const color = getColorForUsername(username);
    return { username, color };
  } catch (err) {
    return false;
  }
}

/**
 * WebSocket server instance
 * Note: port is not specified here as it will use the HTTP server port
 */
export const wsServer = new WSServerPubSub({
  origins,
  authCallback,
});
