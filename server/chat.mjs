// server/index.mjs  (remplace ton fichier serveur existant par ceci ou adapte)
import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectMongo } from './db/mongo.mjs'; // <-- assure-toi que ton connectMongo exporté s'appelle comme ça
import { wsServer } from './store/wsStore.mjs';
import { emoteCommand } from './commands/emote.mjs';
import { privateMessageCommand } from './commands/privateMessage.mjs';
import { setupUsersChannel } from './channels/users.mjs';
import { setupChatChannel } from './channels/chat.mjs';
import apiRouter from './routes/api.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // 1) Connect to MongoDB first
  try {
    await connectMongo(console); // doit faire await mongoose.connect(...)
  } catch (err) {
    console.error('Impossible de se connecter à MongoDB, arrêt du serveur.', err);
    process.exit(1);
  }

  // 2) Create app after successful DB connection
  const app = express();
  const httpServer = http.createServer(app);

  app.use(express.json());

  // Mount API router
  app.use('/api', apiRouter);

  // Simple health endpoint to check mongoose readyState
  app.get('/health', (req, res) => {
    const mongoose = awaitImportMongoose(); // helper below
  });

  // Serve static (vite build)
  app.use(express.static(path.join(__dirname, '../dist')));

  // setup WS RPCs / channels
  wsServer.addRpc('/em', emoteCommand);
  wsServer.addRpc('/pm', privateMessageCommand);
  setupUsersChannel();
  setupChatChannel();

  // Start server
  const port = process.env.BACKEND_PORT ? parseInt(process.env.BACKEND_PORT, 10) : 8989;
  httpServer.listen(port, () => {
    console.log(`HTTP server listening on ${port}`);
  });

  // Start WS server (if wsServer.start requires server option)
  wsServer.start({ server: httpServer });
}

// helper to avoid top-level require oddities
function awaitImportMongoose() {
  // lazy require so file loads ok
  return mongoose.default || mongoose;
}

main().catch(err => {
  console.error('Erreur lors du démarrage du serveur :', err);
  process.exit(1);
});