import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { wsServer } from './store/wsStore.mjs';
import { emoteCommand } from './commands/emote.mjs';
import { privateMessageCommand } from './commands/privateMessage.mjs';
import { setupUsersChannel } from './channels/users.mjs';
import { setupChatChannel } from './channels/chat.mjs';
import apiRouter from './routes/api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

app.use(express.json());

app.use('/api', apiRouter);

// Express serve static files from the 'dist' directory (Vite build)
app.use(express.static(path.join(__dirname, '../dist')));

// WebSocket server setup
wsServer.addRpc('/em', emoteCommand);
wsServer.addRpc('/pm', privateMessageCommand);
setupUsersChannel();
setupChatChannel();

// Start HTTP server and WebSocket server
const port = process.env.VITE_WS_PORT ? parseInt(process.env.BACKEND_PORT) : 100000;
httpServer.listen(port, () => console.log(`HTTP server listening on ${port}`));
wsServer.start({ server: httpServer });