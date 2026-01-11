import { ref, computed } from "vue";
import { WSClient } from 'wsmini';
import { fetchJson } from '@/utils/fetchJson';

export const isAuth = ref(false);
export const users = ref([]);
export const allUsers = ref([]); // All users from database
export const allMsg = ref([]);
export const privateMessages = ref({}); // { username: [messages] }
export const conversations = ref([]); // List of conversation partners with last message
export const showUsersList = ref(false);
export const currentUsername = ref('');
export const currentUserId = ref('');
export const authToken = ref('');

const wsHost = import.meta.env.VITE_WS_HOST || 'localhost';
const wsPort = import.meta.env.VITE_WS_PORT || '8989';
const wsProtocol = import.meta.env.VITE_WS_PROTOCOL || 'ws';
export const ws = new WSClient(`${wsProtocol}://${wsHost}:${wsPort}`);

// Decode JWT to get username
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Add a private message to the correct conversation
function addPrivateMessage(msg) {
  const partner = msg.from === currentUsername.value ? msg.to : msg.from;
  
  if (!privateMessages.value[partner]) {
    privateMessages.value[partner] = [];
  }
  
  // Check for duplicates by _id or timestamp+content
  const isDuplicate = privateMessages.value[partner].some(
    m => (m._id && m._id === msg._id) || 
         (m.timestamp === msg.timestamp && m.from === msg.from && m.content === msg.content)
  );
  
  if (!isDuplicate) {
    privateMessages.value[partner].push(msg);
    // Sort by timestamp
    privateMessages.value[partner].sort((a, b) => a.timestamp - b.timestamp);
  }
}

// Load all users from database (with their subject profiles)
export async function loadAllUsers() {
  try {
    // Try to get users with subjects first
    let response = await fetch('/api/users-with-subjects');
    if (response.ok) {
      const data = await response.json();
      allUsers.value = data;
      return;
    }
    
    // Fallback to regular users endpoint
    response = await fetch('/api/users');
    if (response.ok) {
      const data = await response.json();
      allUsers.value = data;
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
}

// Load conversations list from API
export async function loadConversations() {
  if (!authToken.value) return;
  
  try {
    const response = await fetch('/api/pm/conversations', {
      headers: {
        'Authorization': `Bearer ${authToken.value}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      conversations.value = data;
      
      // Pre-populate privateMessages with last messages
      data.forEach(conv => {
        if (conv.lastMessage && !privateMessages.value[conv.partner]) {
          privateMessages.value[conv.partner] = [];
        }
        if (conv.lastMessage) {
          addPrivateMessage(conv.lastMessage);
        }
      });
    }
  } catch (err) {
    console.error('Error loading conversations:', err);
  }
}

// Load conversation history from API
export async function loadConversation(partner) {
  if (!authToken.value) return;
  
  try {
    const response = await fetch(`/api/pm/conversation/${encodeURIComponent(partner)}`, {
      headers: {
        'Authorization': `Bearer ${authToken.value}`
      }
    });
    
    if (response.ok) {
      const messages = await response.json();
      privateMessages.value[partner] = messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp).getTime()
      }));
    }
  } catch (err) {
    console.error('Error loading conversation:', err);
  }
}

// Send a private message via API (saves to database)
export async function sendPrivateMessage(to, content) {
  if (!authToken.value) {
    throw new Error('Non authentifié');
  }
  
  const response = await fetch('/api/pm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken.value}`
    },
    body: JSON.stringify({ to, content })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur lors de l\'envoi');
  }
  
  const messageData = await response.json();
  
  // The message will be added via WebSocket if online, 
  // but also add it locally to be sure
  addPrivateMessage(messageData);
  
  return messageData;
}

// Mark messages as read
export async function markMessagesAsRead(partner) {
  if (!authToken.value) return;
  
  try {
    await fetch(`/api/pm/read/${encodeURIComponent(partner)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken.value}`
      }
    });
  } catch (err) {
    console.error('Error marking as read:', err);
  }
}

// Get messages for a specific conversation
export function getConversationMessages(username) {
  return computed(() => privateMessages.value[username] || []);
}

export async function connectToChat(token) {
  // If token is provided, store it; otherwise try to get from cookie
  if (token) {
    authToken.value = token;
    // Also store in localStorage for persistence
    try {
      localStorage.setItem('authToken', token);
    } catch (e) {}
  } else {
    // Try to get token from localStorage
    try {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        authToken.value = storedToken;
      }
    } catch (e) {}
  }
  
  // If still no token, return early
  if (!authToken.value) {
    return;
  }
  
  // Decode token to get current user info
  const decoded = decodeToken(authToken.value);
  if (decoded?.firstName) {
    currentUsername.value = decoded.firstName;
  }
  if (decoded?.sub) {
    currentUserId.value = decoded.sub;
  }
  
  // Connect to WebSocket
  await ws.connect(authToken.value);
  await ws.sub('users', usersList => users.value = usersList);
  
  // Subscribe to public chat (for group chats)
  await ws.sub('chat', msg => {
    const isDuplicate = allMsg.value.some(
      m => m.timestamp === msg.timestamp && m.username === msg.username && m.content === msg.content
    );
    if (!isDuplicate) {
      allMsg.value.push(msg);
    }
  });
  
  // Handle real-time private messages
  ws.onCmd('pm', msg => {
    addPrivateMessage(msg);
  });
  
  isAuth.value = true;
  
  // Load all users from database
  await loadAllUsers();
  
  // Load existing conversations from database
  await loadConversations();
}

export async function logout() {
  await fetchJson({ url: '/api/auth/logout', method: 'POST' });
  isAuth.value = false;
  users.value = [];
  allUsers.value = [];
  allMsg.value = [];
  privateMessages.value = {};
  conversations.value = [];
  currentUsername.value = '';
  currentUserId.value = '';
  authToken.value = '';
  // Clear stored token
  try {
    localStorage.removeItem('authToken');
  } catch (e) {}
  ws.close();
}
