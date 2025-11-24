import { ref } from "vue";
import { WSClient } from 'wsmini';
import { fetchJson } from '@/utils/fetchJson';

export const isAuth = ref(false);
export const users = ref([]);
export const allMsg = ref([]);
export const showUsersList = ref(false);

const wsHost = import.meta.env.VITE_WS_HOST ?? 'localhost';
const wsPort = import.meta.env.VITE_WS_PORT ?? '8888';
const wsProtocol = import.meta.env.VITE_WS_PROTOCOL ?? 'wss';
export const ws = new WSClient(`${wsProtocol}://${wsHost}:${wsPort}`);

export async function connectToChat(token) {
  await ws.connect(token);
  await ws.sub('users', usersList => users.value = usersList);
  await ws.sub('chat', msg => allMsg.value.push(msg));
  ws.onCmd('pm', msg => allMsg.value.push(msg));
  isAuth.value = true;
}

export async function logout() {
  await fetchJson({ url: '/api/auth/logout', method: 'POST' });
  isAuth.value = false;
  users.value = [];
  allMsg.value = [];
  ws.close();
}