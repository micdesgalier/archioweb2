// server/index.mjs
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

/**
 * 👉 Cette fonction crée l'app Express
 * 👉 Elle est utilisée par les tests (supertest)
 */
export async function createApp() {
  /* ==============================
   * 1) Connexion MongoDB
   * ============================== */
  await connectMongo(console);

  /* ==============================
   * 2) App Express
   * ============================== */
  const app = express();

  app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }));

  app.use(express.json());

  /* ==============================
   * 3) Static uploads
   * ============================== */
  app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
  );

  /* ==============================
   * 4) API
   * ============================== */
  app.use('/api', apiRouter);

  /* ==============================
   * 5) Health check
   * ============================== */
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      mongoState: mongoose.connection.readyState
    });
  });

  /* ==============================
   * 6) Frontend build (Vite)
   * ============================== */
  app.use(express.static(path.join(__dirname, '../dist')));

  return app;
}

/**
 * 👉 Démarrage du serveur
 * 👉 NE SE LANCE PAS en test
 */
async function startServer() {
  try {
    const app = await createApp();
    const httpServer = http.createServer(app);

    /* ==============================
     * WebSocket
     * ============================== */
    wsServer.addRpc('/em', emoteCommand);
    wsServer.addRpc('/pm', privateMessageCommand);
    setupUsersChannel();
    setupChatChannel();

    const port = process.env.BACKEND_PORT
      ? parseInt(process.env.BACKEND_PORT, 10)
      : 8989;

    httpServer.listen(port, () => {
      console.log(`🚀 HTTP server listening on http://localhost:${port}`);
    });

    wsServer.start({ server: httpServer });

  } catch (err) {
    console.error('❌ Erreur fatale serveur:', err);
    process.exit(1);
  }
}

/**
 * 🚨 IMPORTANT
 * Le serveur ne démarre PAS quand NODE_ENV === 'test'
 */
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default createApp;