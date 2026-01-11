// server/routes/upload.mjs
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Attachment from '../models/Attachment.mjs';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dossier uploads (assure-toi qu'il existe)
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Storage config : filename unique (timestamp + original name)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const orig = file.originalname || 'file';
    const safeName = String(orig).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}-${safeName}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    // Autorise images, PDFs, documents
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (!file.mimetype || !allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé'));
    }
    cb(null, true);
  }
});

/**
 * POST /api/upload-photo
 * FormData:
 *  - photo: file (required)
 *  - message_id: optional (string ObjectId) to link the attachment to a message
 */
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });

    const { filename, originalname, mimetype, size } = req.file;
    const fileUrl = `/uploads/${filename}`;

    // message_id optionnel : on vérifie s'il s'agit d'un ObjectId valide
    let messageId = req.body?.message_id ?? null;
    if (messageId && !mongoose.Types.ObjectId.isValid(messageId)) {
      // si invalide, on l'ignore (on peut aussi renvoyer une erreur si tu préfères)
      messageId = null;
    }

    // Créer l'attachment en base (message_id peut être null)
    const attachment = await Attachment.create({
      message_id: messageId,
      file_url: fileUrl,
      mime_type: mimetype,
      file_size: size,
    });

    // Réponse avec l'objet attachment (conforme au modèle)
    return res.status(201).json({
      ok: true,
      attachment,
      file: {
        filename,
        originalname,
        mime_type: mimetype,
        file_size: size,
        file_url: fileUrl,
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    // Gestion d'erreurs Mongoose validation
    if (err && err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    // Erreur multer (ex: fileFilter)
    if (err instanceof multer.MulterError || err.message === 'Seules les images sont autorisées') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

export default router;