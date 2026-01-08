// server/index.mjs
import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { connectMongo } from './db/mongo.mjs';
import { wsServer } from './store/wsStore.mjs';
import { emoteCommand } from './commands/emote.mjs';
import { privateMessageCommand } from './commands/privateMessage.mjs';
import { setupUsersChannel } from './channels/users.mjs';
import { setupChatChannel } from './channels/chat.mjs';
import apiRouter from './routes/api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  /* ==============================
   * 1) Connexion MongoDB
   * ============================== */
  try {
    await connectMongo(console);
    console.log('✅ MongoDB connecté');
  } catch (err) {
    console.error('❌ Impossible de se connecter à MongoDB', err);
    process.exit(1);
  }

  /* ==============================
   * 2) App Express
   * ============================== */
  const app = express();
  const httpServer = http.createServer(app);

  app.use(express.json());

  /* ==============================
   * 3) Static uploads
   * ============================== */
  app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
  );
  // → accessible via http://localhost:8989/uploads/mon-image.jpg

  /* ==============================
   * 4) API
   * ============================== */
  app.use('/api', apiRouter);
  // ⚠️ upload est monté DANS api.mjs

  /* ==============================
   * 5) Health check
   * ============================== */
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      mongoState: mongoose.connection.readyState, // 1 = connecté
    });
  });

  /* ==============================
   * 6) Frontend build (Vite)
   * ============================== */
  app.use(express.static(path.join(__dirname, '../dist')));

  /* ==============================
   * 7) WebSocket
   * ============================== */
  wsServer.addRpc('/em', emoteCommand);
  wsServer.addRpc('/pm', privateMessageCommand);
  setupUsersChannel();
  setupChatChannel();

  /* ==============================
   * 8) Start server
   * ============================== */
  const port = process.env.BACKEND_PORT
    ? parseInt(process.env.BACKEND_PORT, 10)
    : 8989;

  httpServer.listen(port, () => {
    console.log(`🚀 HTTP server listening on http://localhost:${port}`);
  });

  wsServer.start({ server: httpServer });
}

main().catch(err => {
  console.error('❌ Erreur fatale serveur:', err);
  process.exit(1);
});