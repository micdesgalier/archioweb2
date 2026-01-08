// server/models/Attachment.mjs
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const attachmentSchema = new Schema(
  {
    // Message lié (OPTIONNEL)
    message_id: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: false,
      default: null,
    },

    // URL publique du fichier
    file_url: {
      type: String,
      required: true,
      trim: true,
    },

    mime_type: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    file_size: {
      type: Number,
      min: 0, // en octets
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index pour récupérer rapidement les pièces jointes d'un message
attachmentSchema.index({ message_id: 1 });

/**
 * Règles métier
 * Middleware async (PAS de next)
 */
attachmentSchema.pre('save', async function () {
  if (!this.file_url || !this.file_url.trim()) {
    throw new Error('Le fichier doit avoir une URL valide.');
  }
});

export const Attachment = model('Attachment', attachmentSchema);
export default Attachment;